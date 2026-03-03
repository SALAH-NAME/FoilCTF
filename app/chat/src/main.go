package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedMethods: []string{http.MethodHead, http.MethodGet, http.MethodPost, http.MethodDelete},
		AllowedHeaders: []string{"*"},
	}))
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Get("/health", hub.ServeHealth)
	r.Get("/metrics", metricsHandler().(http.HandlerFunc))

	r.Route("/api/chat", func (r chi.Router) {
		r.Use(metricsMiddleware)
		r.Use(hub.AuthMiddleware)

		r.Get("/", hub.ServeChat)
		r.Get("/users", hub.ServeGetUsers)
		r.Get("/list", hub.ServeChatHistory)
	})
	return r
}

func NewServer(router http.Handler) (*http.Server, string) {
	port := GetEnv("PORT", "3003")
	return &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}, port
}

func main() {
	db, err := DbInit()
	if err != nil {
		log.Fatalf("ERROR: DATABASE: %v", err)
	}
	conf := NewDefaultConfig()
	hub := NewHub(db, &conf)
	go hub.TrackChannels()

	router := hub.RegisterRoutes()
	srv, port := NewServer(router)
	log.Printf("INFO: SERVER: Listener address %s", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("ERROR: SERVER: Could not listen and serve: %v", err)
	}
}
