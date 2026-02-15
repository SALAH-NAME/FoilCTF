package main

import (
	"log"
	"net/http"
)

func (h *Hub) ServeScoreboardWs(w http.ResponseWriter, r *http.Request, eventID int) {
	userID, ok := r.Context().Value(userIDKey).(*int)
	if !ok {
		// handle error
	}
	connection, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		JSONError(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(userID, connection, eventID, h)
	go joinedClient.ReadData()
	go joinedClient.WriteData()

	h.RegisterChan <- joinedClient
	initSbData, err := h.FetchScoreboardData(w, eventID)
	if err != nil {
		log.Printf("Could not fetch scorebord data due to : %v", err)
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
