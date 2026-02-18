package main

import (
	"log"
	"net/http"
)

func NewServer(router http.Handler) (*http.Server, string) {
	port := GetEnv("PORT", "3009")
	return &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}, port
}

func main() {
	conf := NewConfig()

	db, err := DbInit()
	if err != nil {
		log.Fatalf("Database Error: %v", err)
	}

	hub := GetHub(db, conf)
	go hub.ChannelsMonitoring()

	router := hub.RegisterRoutes()
	srv, port := NewServer(router)
	log.Printf("DEBUG - HTTP - Listening on http://localhost:%s", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("ERROR - HTTP - Could not start due to: %v", err)
	}
}
