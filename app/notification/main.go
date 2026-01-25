package main

import (
	"net/http"
	"notification-service/config"
	"notification-service/service"
	"log"
)
func main () {

	NotificationPort := config.GetEnv("PORT", "3004")
	db := config.Db_init()
	conf := config.NewDefaultConfig()
	hub := service.NewHub(db, conf)
	go hub.TrackChannels()
	http.HandleFunc("/api/notifications/ws", hub.ServWs)
	http.HandleFunc("/api/notifications/", hub.NotificationHandler)
	//for testing
	http.HandleFunc("/api/test/create", hub.Test)

	if err := http.ListenAndServe(":" + NotificationPort, nil); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v" , err)
	}

}