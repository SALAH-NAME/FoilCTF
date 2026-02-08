package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := mux.NewRouter()
	r.Use(hub.AuthMiddleware)

	r.HandleFunc("/api/notifications/ws", hub.ServWs).Methods("GET")
	r.HandleFunc("/api/notifications/", hub.HandleListNotifications).Methods("GET")
	r.HandleFunc("/api/notifications/", hub.HandleReadAll).Methods("PATCH")
	r.HandleFunc("/api/notifications/", hub.HandleDeleteAll).Methods("DELETE")

	r.HandleFunc("/api/notifications/{id:[0-9]+}", hub.HandleReadSingle).Methods("PATCH")
	r.HandleFunc("/api/notifications/{id:[0-9]+}", hub.HandleDeleteSingle).Methods("DELETE")

	// for testing
	r.HandleFunc("/api/test/create", hub.Test).Methods("POST")

	return r
}
