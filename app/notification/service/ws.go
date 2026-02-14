package service

import (
	"log"
	"net/http"
)

func (hub *Hub) ServeWs(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(int)
	userRole := r.Context().Value(userRoleKey).(string)

	connection, err := hub.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: WEBSOCKET: Upgrading http connection failed : %v", err)
		JSONError(w, "Could not upgrade to a websocket connection", http.StatusBadRequest)
		return
	}

	joinedClient := NewClient(userID, userRole, connection, hub)
	hub.RegisterChan <- joinedClient

	go joinedClient.ReadFromConnectionTunnel()
	go joinedClient.WriteToConnectionTunnel()
}
