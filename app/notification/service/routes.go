package service

import (
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

	r.Get("/metrics", MetricsHandler().(http.HandlerFunc))
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	r.Route("/api/notifications", func (r chi.Router) {
		r.Use(hub.AuthMiddleware)

		r.Get("/", hub.HandleListNotifications)
		r.Patch("/", hub.HandleReadAll)
		r.Delete("/", hub.HandleDeleteAll)

		r.Get("/ws", hub.ServeWs)
		r.Patch("/{id:[0-9]+}", hub.HandleReadSingle)
		r.Delete("/{id:[0-9]+}", hub.HandleDeleteSingle)
	})
	return MetricsMiddleware(r)
}
