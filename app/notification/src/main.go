package main

import (
	"log"
)

func main() {
	db_conf := NewDefaultConfig()

	db, err := DbInit()
	if err != nil {
		log.Fatalf("DATABASE ERROR: %v", err)
	}
	hub := NewHub(db, db_conf)
	go hub.TrackChannels()

	router := hub.RegisterRoutes()

	srv, port := NewServer(router)
	log.Printf("Notification Service Started On Port: %s !", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v", err)
	}
}
