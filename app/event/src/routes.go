package main

import (
	"net/http"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

)

func (s * Server) RegisterRoutes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Use(s.IdentityMiddleware)
	r.Route("/api",  func(r chi.Router) {
		r.Group(s.PublicRoutes)
		r.Group(s.ProtectedRoutes)
		r.Group(s.OrganizerRoutes)
	})
	return r
}

func (s * Server) PublicRoutes(r chi.Router) {
	r.Get("/events", s.ListEvents)
	r.Get("/events/{id}", s.GetEvent)
}

func (s *Server) ProtectedRoutes(r chi.Router) {
	r.Use(s.PlayerAuthMiddleware)
	r.Route("/events/{id}", func(r chi.Router) {
		//ensure event active
		r.Get("/scoreboard", s.GetScoreboard)
		r.Get("/challenges", s.ListCtfChallenges)
		r.Post("/challenges/{chall_id}/spawn", s.RequestSandbox)
		r.Post("/challenges/{chall_id}/kill", s.KillSandbox)
		r.Post("/challenges/{chall_id}/submit", s.SubmitFlag)
	})
}

func (s *Server) OrganizerRoutes(r chi.Router) {
	r.Route("/admin/events",func(r chi.Router) {
		r.Use(s.OrganizerAuthMiddleware)
		r.Get("/", s.ListAllEvents)
		r.Post("/", s.CreateEvent)

		r.Route("/{id}", func (r chi.Router){
			r.Use(s.EnsureEventOwnership)
			r.Put("/", s.UpdateEvent)
			r.Delete("/", s.DeleteEvent)
			r.Route("/challenges", func (r chi.Router){
				r.Post("/", s.LinkChallenge)
				r.Delete("/", s.UnlinkChallenge)
		})
		})

	})
}
