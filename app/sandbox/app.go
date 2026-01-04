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

	dbUser, dbPass := os.Getenv("DB_USER"), os.Getenv("DB_PASS")
	if dbUser == "" {
		return errors.New("required environment variable \"DB_USER\" is not set")
	}
	podmanUri, podmanDir := os.Getenv("PODMAN_URI"), os.Getenv("PODMAN_DIR")
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

	app.database, err = Database_Connect(dbUser, dbPass)
	if err != nil {
		return err
	}

	app.server = fiber.New() // TODO(xenobas): Replace logging with our own solution
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

func (app *App) RegisterRoutes(routes []Route) {
	for _, route := range routes {
		app.server.Add(route.methods, route.pattern, route.handler)
	}
}

func (app *App) Listen() error {
	return app.server.Listen(":8080") // TODO(xenobas): Turn this to an environment variable
}
