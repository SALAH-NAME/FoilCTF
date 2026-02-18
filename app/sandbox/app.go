package main

import (
	"context"
	"log"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"kodaic.ma/sandbox/podman"
)

type App struct {
	Env        Environment
	ConnPodman context.Context
	LogStreams map[string][2]*Stream
	Registry   *prometheus.Registry

	requestsTotal   *prometheus.CounterVec
	requestDuration *prometheus.HistogramVec
}

func (app *App) Init() {
	app.LogStreams = make(map[string][2]*Stream)

	app.Registry = prometheus.NewRegistry()
	app.Registry.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	app.requestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "sandbox",
			Subsystem: "http",
			Name:      "requests_total",
			Help:      "Total number of HTTP requests processed",
		},
		[]string{"method", "code"},
	)

	app.requestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "sandbox",
			Subsystem: "http",
			Name:      "request_duration_seconds",
			Help:      "HTTP request latencies in seconds",
			Buckets:   prometheus.DefBuckets,
		},
		[]string{"method"},
	)

	app.Registry.MustRegister(app.requestsTotal)
	app.Registry.MustRegister(app.requestDuration)
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

	app.LogStreams[imageName] = [2]*Stream{stdout, stderr}
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
