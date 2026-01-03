package main

import (
	"archive/tar"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	fiber "github.com/gofiber/fiber/v3"
)

func Route_List(app *App) Route {
	pattern := "/api/sandbox/list"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		containers, err := Podman_List(app.podman)
		if err != nil {
			log.Printf("Podman list failed due to %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"containers": containers})
	}
	return Route{pattern, methods, handler}
}

type PayloadUpload struct {
	Name string `form:"image_name" query:"image_name"`
}

func Route_Upload(app *App) Route {
	pattern := "/api/sandbox/upload"
	methods := []string{fiber.MethodPost}
	handler := func(c fiber.Ctx) error {
		c.Accepts("multipart/form-data")

		var form PayloadUpload
		if err := c.Bind().Body(&form); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
		}

		archiveName := filepath.Base(strings.TrimSpace(form.Name))
		if archiveName == "." || archiveName == ".." {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid \"name\""})
		}

		archivePath := filepath.Join(app.imagesDir, archiveName)
		if _, err := os.Stat(archivePath); !os.IsNotExist(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Image \"%s\" already exists", archiveName)})
		}
		if err := os.MkdirAll(archivePath, 0750); err != nil {
			log.Printf("Could not create image directory: %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		archiveData, err := c.FormFile("image_archive")
		if err != nil {
			log.Printf("Could not get form file \"archive\": %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing \"archive\" file"})
		}

		archiveFile, err := archiveData.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid tar file"})
		}
		defer archiveFile.Close()

		archiveTar := tar.NewReader(archiveFile)
		containerFilePresent := false
		for {
			header, err := archiveTar.Next()
			if err == io.EOF {
				break
			}
			if err != nil {
				log.Printf("Failure during extraction form tar archive \"%s\": %v", archiveName, err)
				return c.SendStatus(fiber.StatusInternalServerError)
			}

			switch header.Typeflag {
			case tar.TypeDir:
				// NOTE(xenobas): I don't know if it's safe to just clean and do further processing on the TypeDir/TypeReg to avoid path traversal
				// I assume since links are skipped we're safe, but maybe I'm wrong.
				dirName := filepath.Clean(header.Name)
				dirPath := filepath.Join(archivePath, dirName)

				if err := os.MkdirAll(dirPath, 0750); err != nil {
					log.Printf("Could not create image \"%s\" sub directory: %v", dirPath, err)
					return c.SendStatus(fiber.StatusInternalServerError)
				}
			case tar.TypeReg:
				fileName := filepath.Clean(header.Name)
				if fileName == "Containerfile" || fileName == "Dockerfile" {
					fileName = "Containerfile"
					containerFilePresent = true
				}
				filePath := filepath.Join(archivePath, fileName)

				file, err := os.Create(filePath)
				if err != nil {
					log.Printf("Could not create image \"%s\" file: %v", filePath, err)
					return c.SendStatus(fiber.StatusInternalServerError)
				}
				defer file.Close()

				_, err = io.Copy(file, archiveTar)
				if err != nil {
					log.Printf("Could not write unto image \"%s\" file: %v", filePath, err)
					return c.SendStatus(fiber.StatusInternalServerError)
				}
			default:
				log.Printf("Skipping extracting file \"%s\" due to unknown file type", header.Name)
			}
		}
		if !containerFilePresent {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing Containerfile"})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"name": archiveName})
	}
	return Route{pattern, methods, handler}
}

// TODO(xenobas):
// -	Implement Route_Build: 	Builds the container.
// -  Implement Route_Start: 	Starts the container.
// -  Implement Route_Stop:  	Stops the container.
// -  Implement Route_Inspect: Inspects the container.
// -  Do we need to integrate the database here? If so... then how?
// -  What about logs as well?
