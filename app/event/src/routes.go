package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (h *Hub) RegisterRoutes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(h.MetricsMiddleware)
	r.Use(h.IdentityMiddleware)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	r.Handle("/metrics", h.MetricsHandler())

	r.Route("/api", func(r chi.Router) {
		r.Route("/events", func(r chi.Router) {
			r.Get("/", h.ListEvents)
			r.Route("/{id}", func(r chi.Router) {
				r.Use(h.EnsureEventExists)
				r.Get("/", h.GetEvent)
				r.Get("/scoreboard", h.GetScoreboard)
				r.Group(func(r chi.Router) {
					r.Use(h.PlayerAuthMiddleware)
					r.Get("/join", h.JoinEvent)
					r.Group(func(r chi.Router) {
						r.Use(h.EnsureEventAccess)
						r.Get("/challenges", h.ListCtfsChallenges)
						r.Post("/challenges/{chall_id}/submit", h.SubmitFlag)
					})
				})
			})
		})
		r.Route("/admin/events", func(r chi.Router) {
			r.Use(h.OrganizerAuthMiddleware)
			r.Get("/", h.ListAllEvents)
			r.Post("/", h.CreateEvent)

			r.Route("/{id}", func(r chi.Router) {
				r.Use(h.EnsureEventOwnership)
				// r.Get("/")
				r.Put("/", h.UpdateEvent)
				r.Delete("/", h.DeleteEvent)
				r.Post("/start", h.StartEvent)
				r.Post("/stop", h.StopEvent)
				r.Post("/challenges", h.LinkChallenge)
				r.Delete("/challenges/{chall_id}", h.UnlinkChallenge)
			})
		})
	})
	return r
}
