package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/health", hub.ServeHealth).Methods(http.MethodGet)
	r.Handle("/metrics", metricsHandler()).Methods(http.MethodGet)

	r.Use(metricsMiddleware)

	rAuthProtected := r.NewRoute().Subrouter()
	rAuthProtected.Use(hub.AuthMiddleware)
	rAuthProtected.HandleFunc("/api/chat", hub.ServeChat).Methods(http.MethodGet)
	rAuthProtected.HandleFunc("/api/chat/users", hub.ServeGetUsers).Methods(http.MethodGet)
	rAuthProtected.HandleFunc("/api/chat/list", hub.ServeChatHistory).Methods(http.MethodGet)

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
