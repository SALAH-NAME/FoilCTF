package main

import (
	"notification-service/config"
	"notification-service/service"
	"log"
)
func main () {

	db_conf := config.NewDefaultConfig()

	db := config.DbInit()
	hub := service.NewHub(db, db_conf)
	go hub.TrackChannels()

	router := hub.RegisterRoutes()

	srv, port := config.NewServer(router)
	log.Printf("Notification Service Started On Port: %s !", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v" , err)
	}
}