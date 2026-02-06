package main

import (
	"net/http"
	"github.com/go-chi/chi/v5"
)

func (s * Server) PublicRoutes(r chi.Router) {
	r.Get("/api/events", s.ListEvents)
	r.Get("/api/events{id}", s.GetEvent)
}

func (s *Server) ProtectedRoutes(r chi.Router) {
	r.Use(AuthMiddleware)
	r.Route("/api/events/{id}", func(r chi.Router) {
		r.Get("/scoreboard", s.GetScoreboard)
		r.Get("/challenges/", s.ListCtfChallenges)
		r.Post("/challenges/{chall_id}/spawn", s.RequestSandbox)
		r.Post("/challenges/{chall_id}/submit", s.SubmitFlag)
	})
}

func (s *Server) AdminRoutes(r chi.Router) {
	r.Use(AdminMiddleware)
	r.Post("/api/admin/events", s.CreateEvents)
	r.Post("/api/admin/event/{id}/link", s.LinkChallenge)
}

func (s * Server) RegisterRoutes() http.Handler {
	r := chi.NewRouter()

	r.Group(s.PublicRoutes)
	r.Group(s.ProtectedRoutes)
	r.Group(s.AdminRoutes)

	return r
}