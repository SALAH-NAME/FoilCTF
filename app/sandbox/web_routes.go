package main

import (
	"archive/tar"
	"fmt"
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

func Route_Init(app *App) Route {
	// TODO(xenobas): pattern :name should pass through a constraint that only passes the validator [a-z_]+
	pattern := "/api/sandbox/:name/init"

	methods := []string{fiber.MethodPost}
	handler := func(c fiber.Ctx) error {
		c.Accepts("multipart/form-data")

		archiveName := filepath.Base(strings.TrimSpace(c.Params("name")))
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

		archiveData, err := c.FormFile("archive")
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
		archiveContents, err := Archive_Extract(archiveTar, archivePath)
		if err != nil { // TODO(xenobas): Delete lingering files, setup timer for build command otherwise delete
			return c.SendStatus(fiber.StatusBadRequest)
		}

		log.Printf("Extracted %d files into %v", len(archiveContents), archivePath)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"name": archiveName})
	}
	return Route{pattern, methods, handler}
}

func Route_Build(app *App) Route {
	pattern := "/api/sandbox/:name/build"
	methods := []string{ fiber.MethodPost }
	handler := func (c fiber.Ctx) error {
		imageName := filepath.Base(strings.TrimSpace(c.Params("name", "")))
		if imageName == "" || imageName == "." || imageName == ".." {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{ "error": "Invalid \"name\" parameter" })
		}
		imagePath := filepath.Join(app.imagesDir, imageName)

		if _, err := os.Stat(imagePath); os.IsNotExist(err) {
			return c.SendStatus(fiber.StatusNotFound)
		}

		buildOptions := BuildOptions{
			ContainerFiles: []string{ filepath.Join(imagePath, "Containerfile") },
			ContextDirectory: imagePath,
			Name: imageName,
			Tags: []string{ },
		}
		image, err := Podman_Build(app.podman, buildOptions)
		if err != nil {
			log.Printf("Could not build image at \"%s\": %v", imagePath, err)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{ "error": fmt.Sprintf("%s", err) })
		}

		return c.Status(fiber.StatusCreated).JSON(*image)
	}
	return Route{pattern, methods, handler}
}

// TODO(xenobas):
// -  Implement Route_Start: 	Starts the container.
// -  Implement Route_Stop:  	Stops the container.
// -  Implement Route_Inspect: Inspects the container.
// -  Do we need to integrate the database here? If so... then how?
// -  What about logs as well?
