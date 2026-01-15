package main

import (
	// "fmt"
	// "log"
	"encoding/json"
	"net/http"
	// "github.com/gorilla/websocket"
)

type historyResponse struct {
	History []Message	`json:"history"`
	Status	string		`json:"status"`
}

func (h *Hub) serveChatHistory(w http.ResponseWriter, r *http.Request) {
	
	var response []Message
	for _, message := range h.historyTracker {
		response = append(response, message)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(historyResponse{
		History: response,
		Status: "success",
	})
}