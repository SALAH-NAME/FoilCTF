package main

import (
	"log"
	"net/http"
)

func (h *Hub) ServeScoreboardWs(w http.ResponseWriter, r *http.Request, eventID int) {
	userID, ok := r.Context().Value(userIDKey).(*int)
	if !ok {
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	connection, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR - WebSocket - Could not upgrade HTTP connection: %v", err)
		JSONError(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}

	joinedClient := NewClient(userID, connection, eventID, h)
	go joinedClient.ReadData()
	go joinedClient.WriteData()

	h.RegisterChan <- joinedClient
	initSbData, err := h.FetchScoreboardData(w, eventID, nil)
	if err != nil {
		log.Printf("ERROR - WebSocket - Could not fetch scoreboard data: %v", err)
		JSONError(w, "Could not fetch data", http.StatusInternalServerError)
		return
	}

	initData := WsEvent{
		Event:   "init",
		EventID: eventID,
		Payload: initSbData,
	}
	h.SendToClient(joinedClient, initData)
}
