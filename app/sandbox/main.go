package main

import (
	"log"

	fiber "github.com/gofiber/fiber/v3"
)

type Route struct {
	pattern string
	methods []string
	handler fiber.Handler
}

func MakeRoutes(app *App) []Route {
	var routes []Route

	routes = append(routes, Route_List(app))
	routes = append(routes, Route_Upload(app))
	return routes
}

func main() {
	app := new(App)
	err := app.Init()
	if err != nil {
		log.Fatalf("Could not initialize the application due to %v", err)
	}
	defer app.Terminate()

	routes := MakeRoutes(app)
	app.RegisterRoutes(routes)

	app.Listen()
}
