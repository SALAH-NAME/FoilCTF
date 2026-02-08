package main

import (
	"log"
	"net/http"
)

func (hub *Hub) ServWs(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(string)
	userRole := r.Context().Value(userRoleKey).(string)

	connection, err := hub.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		JSONError(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(userID, userRole, connection, hub)
	hub.RegisterChan <- joinedClient
	go joinedClient.ReadFromConnectionTunnel()
	go joinedClient.WriteToConnectionTunnel()
}
