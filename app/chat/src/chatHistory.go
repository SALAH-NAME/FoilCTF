package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

func (h *Hub) ServeChatHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	roomIDStr := r.URL.Query().Get("room")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		log.Printf("ERROR: Failed to parse RoomID for chat history request :%v", err)
		http.Error(w, "Valid RoomID required", http.StatusBadRequest)
		return
	}
	response := []Message{}
	result := h.Db.Model(&Message{}).Where("chatroom_id", roomID).Order("sent_at Desc").Limit(50).Find(&response)
	if result.Error != nil {
		log.Printf("DATABASE ERROR: Failed to fetch message history: %v", result.Error)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"history": response,
	})
}
