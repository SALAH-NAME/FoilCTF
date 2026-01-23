package main

import (
	"log"

	fiber "github.com/gofiber/fiber/v3"
)

func Route_Container_Create(app *App) Route {
	pattern := "/containers/:Name<identifier>"
	methods := []string{"POST"}
	handler := func(c fiber.Ctx) error {
		var containerName string
		var containerCreateOpts ContainerCreateOptions

		c.Accepts("application/json")
		containerName = c.Params("Name")
		if err := c.Bind().Body(&containerCreateOpts); err != nil {
			log.Printf("could not parse JSON ContainerCreateOptions: %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		container, err := Podman_Container_Create(app.podman, containerName, app.dirHealth, containerCreateOpts)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{"container": container})
	}
	return Route{pattern, methods, handler}
}

func Route_Container_List(app *App) Route {
	pattern := "/"
	methods := []string{"GET"}
	handler := func(c fiber.Ctx) error {
		containers, err := Podman_Container_List(app.podman)
		if err != nil {
			log.Printf("containers listing failed due to %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"containers": containers})
	}
	return Route{pattern, methods, handler}
}

func Route_Container_Start(app *App) Route {
	pattern := "/:Name<identifier>/start"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		containerName := c.Params("Name")

		if err := Podman_Container_Start(app.podman, containerName); err != nil {
			log.Printf("could not start container %q: %v", containerName, err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(fiber.StatusOK)
	}
	return Route{pattern, methods, handler}
}

type Query_Container_Stop struct {
	Timeout uint `query:"timeout,default:10"`
}

func Route_Container_Stop(app *App) Route {
	pattern := "/:Name<identifier>/stop"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		containerName := c.Params("Name")

		queryParams := new(Query_Container_Stop)
		if err := c.Bind().Query(queryParams); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		stopTimeout := queryParams.Timeout
		if err := Podman_Container_Stop(app.podman, containerName, stopTimeout); err != nil {
			log.Printf("could not stop container %q: %v", containerName, err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(fiber.StatusOK)
	}
	return Route{pattern, methods, handler}
}

type Query_Container_Delete struct {
	Timeout *uint `query:"timeout"`
	Volumes bool  `query:"volumes,default:false"`
}

func Route_Container_Delete(app *App) Route {
	pattern := "/:Name<identifier>" // ?timeout=<uint?>&volumes=<bool?>
	methods := []string{fiber.MethodDelete}
	handler := func(c fiber.Ctx) error {
		containerName := c.Params("Name")
		queryParams := new(Query_Container_Delete)
		if err := c.Bind().Query(queryParams); err != nil {
			log.Printf("could not parse Query ContainerDelete: %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		opts := new(ContainerRemoveOptions)
		opts = opts.WithVolumes(queryParams.Volumes)
		if queryParams.Timeout != nil {
			opts = opts.WithTimeout(*queryParams.Timeout)
		}

		if err := Podman_Container_Remove(app.podman, containerName, opts); err != nil {
			log.Printf("could not remove container %q: %v", containerName, err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		log.Printf("deleted container %q", containerName)
		return c.SendStatus(fiber.StatusOK)
	}
	return Route{pattern, methods, handler}
}

func Route_Container_Inspect(app *App) Route {
	pattern := "/:Name<identifier>"
	methods := []string{fiber.MethodGet}
	handler := func(c fiber.Ctx) error {
		containerName := c.Params("Name")

		container, err := Podman_Container_Inspect(app.podman, containerName)
		if err != nil {
			log.Printf("could not inspect container %q: %v", containerName, err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		if container == nil {
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"container": *container})
	}
	return Route{pattern, methods, handler}
}
