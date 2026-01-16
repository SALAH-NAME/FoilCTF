package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

type historyResponse struct {
	History []Message	`json:"history"`
	Status	string		`json:"status"`
}

func (h *Hub) serveChatHistory(w http.ResponseWriter, r *http.Request) {
	roomIdStr := r.URL.Query().Get("room")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		http.Error(w, "valid roomID is required",  http.StatusBadRequest)
		return
	}
	var response []Message
	result := h.db.Model(&Message{}).Where("chatroom_id", roomId).Order("sent_at Desc").Limit(50).Find(&response)
	if result.Error != nil {
		log.Printf("Database error while fetching histroy: %v", result.Error)
		http.Error(w, "Internal Server Error",  http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(historyResponse{
		History: response,
		Status: "success",
	})
}