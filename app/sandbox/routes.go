package main

import (
	"os"
	"io"
	"fmt"
	"math"
	"errors"
	"context"
	"strconv"
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"kodaic.ma/sandbox/podman"
)

func adapterRoute(app *App, routeImpl func(app *App, w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		routeImpl(app, w, r)
	})
}
func adapterMiddleware(app *App, middleImpl func(*App, http.Handler) http.Handler) func(http.Handler) http.Handler {
	return (func(next http.Handler) http.Handler {
		return middleImpl(app, next)
	})
}

func routeImageList(app *App, w http.ResponseWriter, r *http.Request) {
	images, err := podman.ImageList(app.ConnPodman)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")

	wJson := json.NewEncoder(w)
	wJson.Encode(map[string]any{"images": images})
}
func routeImageRead(app *App, w http.ResponseWriter, r *http.Request) {
	imageName := chi.URLParam(r, "imageName")

	image, err := podman.ImageInspect(app.ConnPodman, imageName)
	if err != nil {
		log.Printf("could not inspect image %q due to:\n\t%v", imageName, err)

		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")

	wJson := json.NewEncoder(w)
	wJson.Encode(map[string]any{"image": image})
}
func routeImageCreate(app *App, w http.ResponseWriter, r *http.Request) {
	reqCtx := r.Context()

	imageName := chi.URLParam(r, "imageName")
	imageOverride := r.FormValue("override")
	imageDirectory := reqCtx.Value("imageDirectory").(string)

	if imageOverride == "true" {
		if _, err := podman.ImageInspect(app.ConnPodman, imageName); err == nil {
			podman.ImageRemove(app.ConnPodman, imageName)
		}
	}

	imageStdout, imageStderr := app.RegisterLogStream(imageName)
	defer app.UnregisterLogStream(imageName)

	err := podman.ImageCreate(app.ConnPodman, imageName, imageDirectory, imageStdout, imageStderr)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}

	log.Printf("image %q has been created", imageName)
	w.WriteHeader(http.StatusCreated)
}
func routeImageDelete(app *App, w http.ResponseWriter, r *http.Request) {
	imageName := chi.URLParam(r, "imageName")

	if err := podman.ImageRemove(app.ConnPodman, imageName); err != nil {
		log.Printf("could not delete image %q due to:\n\t%v", imageName, err)

		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
func routeImageStdout(app *App, w http.ResponseWriter, r *http.Request) {
	reqCtx := r.Context()

	imageName := chi.URLParam(r, "imageName")
	imageStdout := reqCtx.Value("imageStdout").(*Stream)

	w.WriteHeader(http.StatusPartialContent)

	var buff [512]byte
	for {
		nRead, err := imageStdout.Read(buff[:])
		if err != nil {
			if err != io.EOF {
				log.Printf("could not read image %q stdout due to:\n\t%v", imageName, err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			break
		}

		w.Write(buff[:nRead])
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
	}
}
func routeImageStderr(app *App, w http.ResponseWriter, r *http.Request) {
	reqCtx := r.Context()

	imageName := chi.URLParam(r, "imageName")
	imageStderr := reqCtx.Value("imageStderr").(*Stream)

	w.WriteHeader(http.StatusPartialContent)

	var buff [512]byte
	for {
		nRead, err := imageStderr.Read(buff[:])
		if err != nil {
			if err != io.EOF {
				log.Printf("could not read image %q stderr due to:\n\t%v", imageName, err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			break
		}

		w.Write(buff[:nRead])
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
	}
}

func middleImageName(app *App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		imageName := chi.URLParam(r, "imageName")
		for i, c := range imageName {
			switch {
			case c == '_':
			case c >= '0' && c <= '9' && i > 0:
			case c >= 'a' && c <= 'z':
			default:
				w.WriteHeader(http.StatusBadRequest)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
func middleImageExists(app *App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		imageName := chi.URLParam(r, "imageName")

		exists, err := podman.ImageExists(app.ConnPodman, imageName)
		if err != nil {
			log.Printf("could not check if image %q exists due to:\n\t%v", imageName, err)

			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		if !exists {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		next.ServeHTTP(w, r)
	})
}
func middleImageCreate(app *App, next http.Handler) http.Handler {
	const MaxBodyLimit = 1024 * 32
	return http.MaxBytesHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		imageName := chi.URLParam(r, "imageName")

		imageOverride := r.FormValue("override")
		if imageOverride != "true" {
			exists, err := podman.ImageExists(app.ConnPodman, imageName)
			if err != nil {
				log.Printf("could not check if image %q exists due to:\n\t%v", imageName, err)

				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			if exists {
				w.WriteHeader(http.StatusConflict)
				w.Header().Set("Content-Type", "application/json")

				wJson := json.NewEncoder(w)
				wJson.Encode(map[string]any{"error": "image already exists"})
				return
			}
		}

		archiveFile, archiveInfo, err := r.FormFile("archive")
		if errors.Is(err, http.ErrMissingFile) {
			w.WriteHeader(http.StatusBadRequest)
			w.Header().Set("Content-Type", "application/json")

			wJson := json.NewEncoder(w)
			wJson.Encode(map[string]any{"error": "required \"archive\" file is missing from the form data"})
			return
		}
		if err != nil {
			log.Printf("could not get the archive for image %q due to:\n\t%v", imageName, err)

			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		imageDirectory := filepath.Join(app.Env.PodmanDirImages, imageName)
		log.Printf("creating temporary image %q build directory at %q", imageName, imageDirectory)
		if err := os.MkdirAll(imageDirectory, 0o750); err != nil {
			log.Printf("could not create image %q files directory due to:\n\t%v", imageName, err)

			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer os.RemoveAll(imageDirectory)

		log.Printf("extracting %d bytes from file %q", archiveInfo.Size, archiveInfo.Filename)
		if err := TarExtract(archiveFile, imageDirectory); err != nil {
			log.Printf("could not extract the archive for image %q due to:\n\t%v", imageName, err)

			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		reqCtx := context.WithValue(r.Context(), "imageDirectory", imageDirectory)
		next.ServeHTTP(w, r.WithContext(reqCtx))
	}), MaxBodyLimit)
}
func middleImageBuildLogs(app *App, next http.Handler) http.Handler {
	// DANGER(xenobas): The log streams are limited to single consumer.
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		imageName := chi.URLParam(r, "imageName")

		imageLoggers, exists := app.LogStreams[imageName]
		if !exists {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		reqCtx := context.WithValue(context.WithValue(r.Context(), "imageStdout", imageLoggers[0]), "imageStderr", imageLoggers[1])
		next.ServeHTTP(w, r.WithContext(reqCtx))
	})
}

func RoutesImage(app *App) func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", adapterRoute(app, routeImageList))

		r.Route("/{imageName}", func(r chi.Router) {
			r.Use(adapterMiddleware(app, middleImageName))

			r.With(adapterMiddleware(app, middleImageCreate)).Post("/", adapterRoute(app, routeImageCreate))

			r.With(adapterMiddleware(app, middleImageExists)).Get("/", adapterRoute(app, routeImageRead))
			r.With(adapterMiddleware(app, middleImageExists)).Delete("/", adapterRoute(app, routeImageDelete))

			r.With(adapterMiddleware(app, middleImageBuildLogs)).Get("/stdout", adapterRoute(app, routeImageStdout))
			r.With(adapterMiddleware(app, middleImageBuildLogs)).Get("/stderr", adapterRoute(app, routeImageStderr))
		})
	}
}

// ---

func routeContainerList(app *App, w http.ResponseWriter, r *http.Request) {
	containers, err := podman.ContainerList(app.ConnPodman)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")

	wJson := json.NewEncoder(w)
	wJson.Encode(map[string]any{"containers": containers})
}
func routeContainerRead(app *App, w http.ResponseWriter, r *http.Request) {
	containerName := chi.URLParam(r, "containerName")

	container, err := podman.ContainerInspect(app.ConnPodman, containerName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")

	wJson := json.NewEncoder(w)
	wJson.Encode(map[string]any{"container": container})
}
func routeContainerCreate(app *App, w http.ResponseWriter, r *http.Request) {
	reqCtx := r.Context()

	createOptions := reqCtx.Value("createOptions").(podman.ContainerCreateOptions)
	if err := podman.ContainerCreate(app.ConnPodman, createOptions); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}

	w.WriteHeader(http.StatusCreated)
}
func routeContainerDelete(app *App, w http.ResponseWriter, r *http.Request) {
	containerName := chi.URLParam(r, "containerName")

	if err := podman.ContainerDelete(app.ConnPodman, containerName); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func routeContainerStart(app *App, w http.ResponseWriter, r *http.Request) {
	containerName := chi.URLParam(r, "containerName")
	if err := podman.ContainerStart(app.ConnPodman, containerName); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}
	
	w.WriteHeader(http.StatusOK)
}
func routeContainerStop(app *App, w http.ResponseWriter, r *http.Request) {
	containerName := chi.URLParam(r, "containerName")
	stopTimeoutQuery := r.FormValue("stopTimeout")

	stopTimeout := uint64(math.MaxUint)
	if stopTimeoutQuery != "" {
		var err error
		if stopTimeout, err = strconv.ParseUint(stopTimeoutQuery, 10, 32); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Header().Set("Content-Type", "application/json")

			wJson := json.NewEncoder(w)
			wJson.Encode(map[string]any{"error": "could not parse query parameter \"stopTimeout\""})
			return
		}
	}

	if err := podman.ContainerStop(app.ConnPodman, containerName, uint(stopTimeout)); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Set("Content-Type", "application/json")

		wJson := json.NewEncoder(w)
		wJson.Encode(map[string]any{"error": err})
		return
	}
	
	w.WriteHeader(http.StatusOK)
}

func middleContainerName(app *App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		containerName := chi.URLParam(r, "containerName")
		for i, c := range containerName {
			switch {
			case c == '_':
			case c >= '0' && c <= '9' && i > 0:
			case c >= 'a' && c <= 'z':
			default:
				w.WriteHeader(http.StatusBadRequest)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
func middleContainerExists(app *App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		containerName := chi.URLParam(r, "containerName")

		exists, err := podman.ContainerExists(app.ConnPodman, containerName)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Set("Content-Type", "application/json")

			wJson := json.NewEncoder(w)
			wJson.Encode(map[string]any{"error": err})
			return
		}
		if !exists {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		next.ServeHTTP(w, r)
	})
}
func middleContainerCreate(app *App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		containerName := chi.URLParam(r, "containerName")

		optionsJson, err := io.ReadAll(r.Body)
		if err != nil && err != io.EOF {
			log.Printf("could not read request body:\n\t%v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var options podman.ContainerCreateOptions
		options.HealthLogDestination = app.Env.PodmanDirHealth
		if err := json.Unmarshal(optionsJson, &options); err != nil {
			log.Printf("could not parse request json body:\n\t%v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if containerName != options.Name {
			w.WriteHeader(http.StatusBadRequest)
			w.Header().Set("Content-Type", "application/json")

			wJson := json.NewEncoder(w)
			wJson.Encode(map[string]any{"error": fmt.Sprintf("mismatching url container name %q and body container name %q", containerName, options.Name)})
			return
		}

		reqCtx := context.WithValue(r.Context(), "createOptions", options)
		next.ServeHTTP(w, r.WithContext(reqCtx))
	})
}

func RoutesContainer(app *App) func (r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", adapterRoute(app, routeContainerList))

		r.Route("/{containerName}", func(r chi.Router) {
			r.Use(adapterMiddleware(app, middleContainerName))

			r.With(adapterMiddleware(app, middleContainerExists)).Get("/", adapterRoute(app, routeContainerRead))
			r.With(adapterMiddleware(app, middleContainerCreate)).Post("/", adapterRoute(app, routeContainerCreate))
			r.With(adapterMiddleware(app, middleContainerExists)).Delete("/", adapterRoute(app, routeContainerDelete))
			r.With(adapterMiddleware(app, middleContainerExists)).Patch("/start", adapterRoute(app, routeContainerStart))
			r.With(adapterMiddleware(app, middleContainerExists)).Patch("/stop", adapterRoute(app, routeContainerStop))
		})
	}
}
