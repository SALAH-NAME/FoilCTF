package service

import (
	"context"
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := mux.NewRouter()
	r.Use(AuthMiddleware)

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

func AuthMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-Id")
		userRole := r.Header.Get("X-User-Role")

		if userID == "" {
			log.Printf("Unauthorazed :X-User-Id required")
			JSONError(w, "Unauthorazed :X-User-Id required", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), "userID", userID)
		ctx = context.WithValue(ctx, "userRole", userRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
