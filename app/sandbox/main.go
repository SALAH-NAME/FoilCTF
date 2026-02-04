package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func EnsureDirectories(dirs ...string) error {
	for _, dir := range dirs {
		_, err := os.Stat(dir)
		if err == nil {
			log.Printf("directory %q already exists", dir)
			continue
		} else if !os.IsNotExist(err) {
			return err
		}

		if err := os.MkdirAll(dir, 0o750); err != nil {
			return err
		}
		log.Printf("directory %q was created", dir)
	}
	return nil
}

func main() {
	var app App
	var err error

	srv := chi.NewRouter()
	srv.Use(middleware.Logger)
	srv.Use(middleware.Recoverer)
	srv.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"https://localhost:3006", "http://localhost:3006", "http://127.0.0.1:3006"},
		AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodHead, http.MethodOptions},
	}))

	srv.Route("/api/sandbox/images", RoutesImage(&app))
	srv.Route("/api/sandbox/containers", RoutesContainer(&app))

	if app.Env, err = LoadEnvironment(); err != nil {
		log.Fatalf("could not load environment variables due to:\n\t%v", err)
	}
	if err := EnsureDirectories(app.Env.PodmanDirImages, app.Env.PodmanDirHealth); err != nil {
		log.Fatalf("could not ensure directories due to:\n\t%v", err)
	}

	app.Init()
	if err := app.ConnectPodman(); err != nil {
		log.Fatalf("could not connect to podman socket due to:\n\t%v", err)
	}

	if err := http.ListenAndServe(app.Env.ServerAddress, srv); err != nil {
		log.Fatalf("failed during listen and serve due to:\n\t%v", err)
	}
}
