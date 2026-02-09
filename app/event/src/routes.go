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

	r.Use(h.IdentityMiddleware)
	r.Route("/api", func(r chi.Router) {
		r.Group(h.PublicRoutes)
		r.Group(h.ProtectedRoutes)
		r.Group(h.OrganizerRoutes)
	})
	return r
}

func (h *Hub) PublicRoutes(r chi.Router) {
	r.Get("/events", h.ListEvents)
	r.Get("/events/{id}", h.GetEvent)
	r.Get("/events/{id}/scoreboard", h.GetScoreboardGuest)
}

func (h *Hub) ProtectedRoutes(r chi.Router) {
	r.Route("/events/{id}", func(r chi.Router) {
		r.Use(h.PlayerAuthMiddleware)
		r.Get("/join", h.JoinEvent)
		r.Group(func(r chi.Router) {
			r.Use(h.EnsureEventAccess)
			r.Get("/scoreboard", h.GetScoreboardPlayer)
			r.Get("/challenges", h.ListCtfChallenges)
			r.Post("/challenges/{chall_id}/spawn", h.RequestSandbox)
			r.Post("/challenges/{chall_id}/kill", h.KillSandbox)
			r.Post("/challenges/{chall_id}/submit", h.SubmitFlag)
		})
	})
}

func (h *Hub) OrganizerRoutes(r chi.Router) {
	r.Route("/admin/events", func(r chi.Router) {
		r.Use(h.OrganizerAuthMiddleware)
		r.Get("/", h.ListAllEvents)
		r.Post("/", h.CreateEvent)

		r.Route("/{id}", func(r chi.Router) {
			r.Use(h.EnsureEventOwnership)
			r.Put("/", h.UpdateEvent)
			r.Delete("/", h.DeleteEvent)
			r.Post("/start", h.StartEvent)
			r.Post("/stop", h.StopEvent)
			r.Post("/challenges", h.LinkChallenge)
			r.Delete("/challenges/{chall_id}", h.UnlinkChallenge)
		})

	})
}
