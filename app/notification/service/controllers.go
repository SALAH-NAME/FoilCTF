package service

import (
	"net/http"
	"log"
)
func (hub *Hub)ServWs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Print("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")

	connection, err := hub.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(userID, userRole, connection, hub)
	hub.RegisterChan <- joinedClient
	go joinedClient.ReadFromConnectionTunnel()
	go joinedClient.WriteToConnectionTunnel()
}