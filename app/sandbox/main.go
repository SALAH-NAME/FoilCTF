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

func MakeRoutes(app *App) (routes, containers, images []Route) {
	routes = append(routes, Route_Image_Create(app))
	routes = append(routes, Route_Container_Create(app))

	images = append(images, Route_Image_List(app))
	images = append(images, Route_Image_Inspect(app))
	images = append(images, Route_Image_Build(app))
	images = append(images, Route_Image_Delete(app))

	containers = append(containers, Route_Container_List(app))
	containers = append(containers, Route_Container_Inspect(app))
	containers = append(containers, Route_Container_Start(app))
	containers = append(containers, Route_Container_Stop(app))
	containers = append(containers, Route_Container_Delete(app))

	return routes, containers, images
}

func main() {
	app := new(App)
	err := app.Init()
	if err != nil {
		log.Fatalf("Could not initialize the application due to %v", err)
	}
	defer app.Terminate()

	routes, containers, images := MakeRoutes(app)
	app.RegisterRoutes(routes, containers, images)

	app.Listen()
}
