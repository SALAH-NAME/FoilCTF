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
	db, err := DbInit()
	if err != nil {
		log.Fatalf("Database Error: %v", err)
	}
	conf := NewConfig()
	hub := GetHub(db, conf)
	go hub.ChannelsMonitoring()
	router := hub.RegisterRoutes()
	srv, port := NewServer(router)
	log.Printf("Event Service Started On Port: %s !", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v", err)
	}
}
