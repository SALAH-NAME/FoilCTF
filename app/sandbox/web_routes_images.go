package main

import (
	"archive/tar"
	"fmt"
	"log"
	"os"
	"path/filepath"

	fiber "github.com/gofiber/fiber/v3"
)

func Route_Image_Create(app *App) Route {
	pattern := "/images/:Name<identifier>/create"

	methods := []string{fiber.MethodPost}
	handler := func(c fiber.Ctx) error { // TODO(xenobas): Initialise timeout clock
		c.Accepts("multipart/form-data")

		imageName := c.Params("Name")

		archiveName := filepath.Base(imageName)
		if archiveName == "." || archiveName == ".." {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid \"name\""})
		}

		archiveData, err := c.FormFile("archive")
		if err != nil {
			log.Printf("could not get form file \"archive\": %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing \"archive\" file"})
		}
		// TODO(xenobas): Validate file size

		archivePath := filepath.Join(app.dirImages, archiveName)
		if _, err := os.Stat(archivePath); !os.IsNotExist(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Image \"%s\" already exists", archiveName)})
		}

		if err := os.MkdirAll(archivePath, 0750); err != nil {
			log.Printf("could not create image directory: %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		archiveFile, err := archiveData.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid tar file"})
		}
		defer archiveFile.Close()

		archiveTar := tar.NewReader(archiveFile)
		archiveContents, err := Archive_Extract(archiveTar, archivePath)
		if err != nil { // TODO(xenobas): Delete lingering files, setup cron timeout for build command otherwise delete
			return c.SendStatus(fiber.StatusBadRequest)
		}

		log.Printf("extracted %d files into %v", len(archiveContents), archivePath)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"Name": archiveName})
	}
	return Route{pattern, methods, handler}
}

func Route_Image_Build(app *App) Route {
	pattern := "/images/:Name<identifier>/build"
	methods := []string{fiber.MethodPost}
	handler := func(c fiber.Ctx) error {
		imageName := c.Params("Name")

		imageDir := filepath.Base(imageName)
		if imageDir == "" || imageDir == "." || imageDir == ".." { // TODO(xenobas): I fucking hate this
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid \"name\" parameter"})
		}

		imagePath := filepath.Join(app.dirImages, imageDir)
		if _, err := os.Stat(imagePath); os.IsNotExist(err) {
			return c.SendStatus(fiber.StatusNotFound)
		}

		var buildOptions BuildOptions
		buildOptions.ContextDirectory = imagePath
		buildOptions.ContainerFiles = []string{filepath.Join(imagePath, "Containerfile")}
		buildOptions.Name = imageName

		image, err := Podman_Image_Build(app.podman, buildOptions)
		if err != nil {
			log.Printf("could not build image at %q: %v", imagePath, err)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": fmt.Sprintf("%s", err)})
		}

		return c.Status(fiber.StatusCreated).JSON(*image)
	}
	return Route{pattern, methods, handler}
}

func Route_Image_List(app *App) Route {
	pattern := "/"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		images, err := Podman_Image_List(app.podman)
		if err != nil {
			log.Printf("images listing failed due to %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"images": images})
	}
	return Route{pattern, methods, handler}
}

func Route_Image_Inspect(app *App) Route {
	pattern := "/:Name<identifier>"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		imageName := c.Params("Name")
		imageCalculateSize := fiber.Query[bool](c, "calculateSize", false)

		image, err := Podman_Image_Inspect(app.podman, imageName, imageCalculateSize)
		if err != nil {
			log.Printf("could not inspect image %q: %v", imageName, err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		if image == nil {
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"image": *image})
	}
	return Route{pattern, methods, handler}
}

func Route_Image_Delete(app *App) Route {
	pattern := "/:Name<identifier>"
	methods := []string{fiber.MethodDelete}
	handler := func(c fiber.Ctx) error { // TODO(xenobas): Check for dependent containers
		imageName := c.Params("Name")

		if err := Podman_Image_Remove(app.podman, imageName); err != nil {
			log.Printf("could not delete image %q: %v", imageName, err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(fiber.StatusOK)
	}
	return Route{pattern, methods, handler}
}
