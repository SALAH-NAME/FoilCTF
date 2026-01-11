package main

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"

	fiber "github.com/gofiber/fiber/v3"
	env "github.com/joho/godotenv"
)

type App struct {
	podman   context.Context
	server   *fiber.App
	database *sql.DB

	imagesDir string
}

func (app *App) Init() error {
	err := env.Load()
	if err != nil {
		return err
	}

	dbUri, podmanUri, podmanDir := os.Getenv("DATABASE_URI"), os.Getenv("PODMAN_URI"), os.Getenv("PODMAN_DIR")
	if dbUri == "" {
		return errors.New("required environment variable \"DATABASE_URI\" is not set")
	}
	if podmanUri == "" {
		return errors.New("required environment variable \"PODMAN_URI\" is not set")
	}
	if podmanDir == "" {
		return errors.New("required environment variable \"PODMAN_DIR\" is not set")
	}

	if app.imagesDir, err = filepath.Abs(podmanDir); err != nil {
		return errors.New("Could not get absolute path from \"PODMAN_DIR\" environment variable")
	}
	if err := os.MkdirAll(app.imagesDir, 0750); err != nil {
		return err
	}

	app.podman, err = Podman_Connect(podmanUri)
	if err != nil {
		return err
	}

	app.database, err = Database_Connect(dbUri)
	if err != nil {
		return err
	}

	app.server = fiber.New() // TODO(xenobas): Replace logging with our own solution
	app.server.RegisterCustomConstraint(&Constraint_Identifier{})
	app.server.Use(Middleware_Authorization)

	return nil
}

func (app *App) Terminate() error {
	var err error

	if err = Database_Disconnect(app.database); err != nil {
		return err
	}

	return nil
}

func (app *App) RegisterRoutes(routes, containers, images []Route) {
	groupApi := app.server.Group("/api/sandbox")
	for _, route := range routes {
		groupApi.Add(route.methods, route.pattern, route.handler)
	}

	groupContainers := groupApi.Group("/containers")
	groupContainers.Use("/:Name<identifier>", Middleware_Container_Exists(app))
	for _, route := range containers {
		groupContainers.Add(route.methods, route.pattern, route.handler)
	}

	groupImages := groupApi.Group("/images")
	groupImages.Use("/api/sandbox/images/:Name<identifier>", Middleware_Image_Exists(app))
	for _, route := range images {
		groupImages.Add(route.methods, route.pattern, route.handler)
	}
}

func (app *App) Listen() error {
	return app.server.Listen(":8080") // TODO(xenobas): Turn this to an environment variable
}
