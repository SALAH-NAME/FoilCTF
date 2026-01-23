package main

import (
	"fmt"
	"log"

	fiber "github.com/gofiber/fiber/v3"
	cors "github.com/gofiber/fiber/v3/middleware/cors"
	// "github.com/gofiber/fiber/v3/client"
)

func Middleware_Logger(app *App) func(c fiber.Ctx) error {
	_ = app
	return func(c fiber.Ctx) error {
		req := c.Req()
		log.Printf("%q :: %s", req.Method(), req.OriginalURL())

		return c.Next()
	}
}

func Middleware_Authorization(app *App) func(c fiber.Ctx) error { // TODO(xenobas): Implement
	_ = app
	return func(c fiber.Ctx) error {
		return c.Next()
	}
}

func Middleware_Container_Exists(app *App) func(c fiber.Ctx) error {
	return func(c fiber.Ctx) error {
		containerName := c.Params("Name")
		containerExists, err := Podman_Container_Exists(app.podman, containerName)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if !containerExists {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("container %q doesn't exist", containerName)})
		}
		return c.Next()
	}
}

func Middleware_Image_Exists(app *App) func(c fiber.Ctx) error {
	return func(c fiber.Ctx) error {
		imageName := c.Params("Name")
		imageExists, err := Podman_Image_Exists(app.podman, imageName)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if !imageExists {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("image %q doesn't exist", imageName)})
		}
		return c.Next()
	}
}

func Middleware_CORS(app *App) func(c fiber.Ctx) error { // TODO(xenobas): Make this query the list of origins from the database
	_ = app
	return cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
	})
}
