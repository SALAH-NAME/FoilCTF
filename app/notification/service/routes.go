package service

import "net/http"

func (hub *Hub)RegisterRoutes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/notifications/ws", hub.ServWs)
	mux.HandleFunc("/api/notifications/", hub.NotificationHandler)

	// for testing
	mux.HandleFunc("POST /api/test/create", hub.Test)

	return mux
}
