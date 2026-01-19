package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

func (h *Hub) serveChatHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	roomIdStr := r.URL.Query().Get("room")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		log.Printf("ERROR: Valid roomID required")
		http.Error(w, "Valid roomID required",  http.StatusBadRequest)
		return
	}
	var response []Message
	result := h.db.Model(&Message{}).Where("chatroom_id", roomId).Order("sent_at Desc").Limit(50).Find(&response)
	if result.Error != nil {
		log.Printf("DATABASE ERROR: Failed to fetch message history: %v", result.Error)
		http.Error(w, "Internal Server Error",  http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"history": response,
	})
}