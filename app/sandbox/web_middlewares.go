package main

import (
	"fmt"

	fiber "github.com/gofiber/fiber/v3"
	// "github.com/gofiber/fiber/v3/client"
)

func Middleware_Authorization(c fiber.Ctx) error {
	// TODO(xenobas): Send request to auth service and get user details with the corresponding Authorization token
	// TODO(xenobas): Figure out where to store the user details
	return c.Next()
}

func Middleware_Container_Exists(app *App) (func (c fiber.Ctx) error) {
	return func (c fiber.Ctx) error {
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

func Middleware_Image_Exists(app *App) (func (c fiber.Ctx) error) {
	return func (c fiber.Ctx) error {
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
