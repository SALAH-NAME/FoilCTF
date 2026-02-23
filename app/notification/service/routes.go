package service

import (
	"net/http"

	"github.com/gorilla/mux"
)

func (hub *Hub) RegisterRoutes() http.Handler {
	r := mux.NewRouter()

	r.Handle("/metrics", MetricsHandler()).Methods(http.MethodGet)

	r.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).Methods(http.MethodGet)

	apiRoute := r.PathPrefix("/api/notifications").Subrouter()

	apiRoute.Use(hub.AuthMiddleware)
	apiRoute.HandleFunc("/ws", hub.ServeWs).Methods(http.MethodGet)
	apiRoute.HandleFunc("/", hub.HandleListNotifications).Methods(http.MethodGet)
	apiRoute.HandleFunc("/", hub.HandleReadAll).Methods(http.MethodPatch)
	apiRoute.HandleFunc("/", hub.HandleDeleteAll).Methods(http.MethodDelete)

	apiRoute.HandleFunc("/{id:[0-9]+}", hub.HandleReadSingle).Methods(http.MethodPatch)
	apiRoute.HandleFunc("/{id:[0-9]+}", hub.HandleDeleteSingle).Methods(http.MethodDelete)

	return MetricsMiddleware(r)
}
