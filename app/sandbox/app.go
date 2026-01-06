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

	imagesDir := os.Getenv("IMAGES_DIR")
	if imagesDir == "" {
		return errors.New("required environment variable \"IMAGES_DIR\" is not set")
	}
	if app.imagesDir, err = filepath.Abs(imagesDir); err != nil {
		return errors.New("Could not get absolute path from \"IMAGES_DIR\" environment variable")
	}
	if err := os.MkdirAll(app.imagesDir, 0750); err != nil {
		return err
	}

	dbUser, dbPass := os.Getenv("DB_USER"), os.Getenv("DB_PASS")
	if dbUser == "" {
		return errors.New("required environment variable \"DB_USER\" is not set")
	}

	app.podman, err = Podman_Connect("unix:///run/user/1000/podman/podman.sock")
	if err != nil {
		return err
	}

	app.database, err = Database_Connect(dbUser, dbPass)
	if err != nil {
		return err
	}

	app.server = fiber.New()
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
	return app.server.Listen(":8080")
}
