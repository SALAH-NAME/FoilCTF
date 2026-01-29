package main

import (
	"log"

	"kodaic.ma/notification/config"
	"kodaic.ma/notification/service"
)

func main() {

	db_conf := config.NewDefaultConfig()

	db, err := config.DbInit()
	if err != nil {
		log.Fatalf("DATABASE ERROR: %v", err)
	}
	hub := service.NewHub(db, db_conf)
	go hub.TrackChannels()

	router := hub.RegisterRoutes()

	srv, port := config.NewServer(router)
	log.Printf("Notification Service Started On Port: %s !", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v", err)
	}
}
