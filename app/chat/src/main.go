package main

import (
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := mux.NewRouter()
	r.Use(hub.AuthMiddleware)
	r.HandleFunc("/api/chat", hub.ServeChat).Methods("GET")
	r.HandleFunc("/api/chat/users", hub.ServeGetUsers).Methods("GET")
	r.HandleFunc("/api/chat/list", hub.ServeChatHistory).Methods("GET")
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
		log.Fatalf("Database Error: %v", err)
	}
	conf := NewDefaultConfig()
	hub := NewHub(db, &conf)
	go hub.TrackChannels()

	router := hub.RegisterRoutes()
	srv, port := NewServer(router)
	log.Printf("Server starting at port %s !", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v", err)
	}
}
