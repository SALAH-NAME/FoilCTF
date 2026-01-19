package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"os"
	"path/filepath"

	fiber "github.com/gofiber/fiber/v3"
	env "github.com/joho/godotenv"
)

type App struct {
	server			*fiber.App
	serverAddr	string

	podman   context.Context
	database *sql.DB

	dirImages string
	dirHealth string
}

func (app *App) Init() error {
	err := env.Load()
	if err != nil {
		return err
	}

	app.serverAddr = os.Getenv("SERVER_ADDR")
	if app.serverAddr == "" {
		app.serverAddr = ":8080"
	}

	dbUri, podmanUri, podmanDirImages, podmanDirHealth := os.Getenv("DATABASE_URI"), os.Getenv("PODMAN_URI"), os.Getenv("PODMAN_DIR_IMAGES"), os.Getenv("PODMAN_DIR_HEALTH")
	if dbUri == "" {
		return errors.New("required environment variable \"DATABASE_URI\" is not set")
	}
	if podmanUri == "" {
		return errors.New("required environment variable \"PODMAN_URI\" is not set")
	}
	if podmanDirImages == "" {
		return errors.New("required environment variable \"PODMAN_DIR_IMAGES\" is not set")
	}
	if podmanDirHealth == "" {
		return errors.New("required environment variable \"PODMAN_DIR_HEALTH\" is not set")
	}

	if app.dirHealth, err = filepath.Abs(podmanDirHealth); err != nil {
		return errors.New("Could not get absolute path from \"PODMAN_DIR_HEALTH\" environment variable")
	}
	if app.dirImages, err = filepath.Abs(podmanDirImages); err != nil {
		return errors.New("Could not get absolute path from \"PODMAN_DIR_IMAGES\" environment variable")
	}

	log.Printf("\"ENV\" :: PODMAN_DIR_IMAGES :: %q", app.dirImages)
	log.Printf("\"ENV\" :: PODMAN_DIR_HEALTH :: %q", app.dirHealth)
	log.Printf("\"ENV\" :: SERVER_ADDR: %q\n", app.serverAddr)

	if err := os.MkdirAll(app.dirHealth, 0750); err != nil {
		return err
	}
	if err := os.MkdirAll(app.dirImages, 0750); err != nil {
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

	app.server = fiber.New(fiber.Config{
		CaseSensitive: true,
		BodyLimit: 4 * 1024 * 1024,

		ReadBufferSize: 16 * 1024,
		WriteBufferSize: 4 * 1024,
	})
	app.server.RegisterCustomConstraint(&Constraint_Identifier{})
	app.server.Use(Middleware_Authorization(app))

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
	groupApi.Use(Middleware_Logger(app))
	for _, route := range routes {
		groupApi.Add(route.methods, route.pattern, route.handler)
	}

	groupContainers := groupApi.Group("/containers")
	groupContainers.Use("/:Name<identifier>", Middleware_Container_Exists(app))
	for _, route := range containers {
		groupContainers.Add(route.methods, route.pattern, route.handler)
	}

	groupImages := groupApi.Group("/images")
	groupImages.Use("/:Name<identifier>", Middleware_Image_Exists(app))
	for _, route := range images {
		groupImages.Add(route.methods, route.pattern, route.handler)
	}
}

func (app *App) Listen() error {
	return app.server.Listen(app.serverAddr, fiber.ListenConfig{
		DisableStartupMessage: true,
	})
}
