package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

func (h *Hub) ServeChatHistory(w http.ResponseWriter, r *http.Request) {
	roomIDStr := r.URL.Query().Get("room")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		log.Printf("ERROR: SERVER: Failed to parse RoomID for chat history request: %v", err)
		JSONError(w, "Valid RoomID required", http.StatusBadRequest)
		return
	}

	response := []Message{}
	err = h.Db.Model(&Message{}).
		Where("chatroom_id = ?", roomID).
		Order("sent_at Desc").
		Limit(50).
		Find(&response).Error
	if err != nil {
		log.Printf("ERROR: DATABASE: Failed to fetch message history: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"history": response,
	})
}
