package main

import (
	"fmt"

	fiber "github.com/gofiber/fiber/v3"
	middleware_cors "github.com/gofiber/fiber/v3/middleware/cors"
	middleware_logger "github.com/gofiber/fiber/v3/middleware/logger"
	// "github.com/gofiber/fiber/v3/client"
)

func Middleware_Logger(app *App) fiber.Handler {
	_ = app
	return middleware_logger.New()
}

func Middleware_Authorization(app *App) fiber.Handler { // TODO(xenobas): Implement
	_ = app
	return func(c fiber.Ctx) error {
		return c.Next()
	}
}

func Middleware_Container_Exists(app *App) fiber.Handler {
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

func Middleware_Image_Exists(app *App) fiber.Handler {
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

func Middleware_CORS(app *App) fiber.Handler { // TODO(xenobas): Make this query the list of origins from the database
	_ = app
	return middleware_cors.New(middleware_cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
	})
}
