package main

import (
	"context"
	"log"

	"kodaic.ma/sandbox/podman"
)

type App struct {
	Env               Environment
	ConnPodman        context.Context
	LogStreams map[string][2]*Stream
}

func (app *App) Init() {
	app.LogStreams = make(map[string][2]*Stream)
}
func (app *App) ConnectPodman() (err error) {
	if app.ConnPodman, err = podman.Connect(app.Env.PodmanUri); err != nil {
		return err
	}
	log.Printf("connected to podman via %q", app.Env.PodmanUri)
	return nil
}

func (app *App) RegisterLogStream(imageName string) (stdout, stderr *Stream) {
	stdout = NewStream(0)
	stderr = NewStream(0)

	app.LogStreams[imageName] = [2]*Stream{ stdout, stderr }
	return stdout, stderr
}
func (app *App) UnregisterLogStream(imageName string) {
	buildLoggers, ok := app.LogStreams[imageName]
	if !ok {
		return
	}

	for _, logger := range buildLoggers {
		logger.Close()
	}
	delete(app.LogStreams, imageName)
}
