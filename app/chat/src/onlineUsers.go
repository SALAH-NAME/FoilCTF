package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"
)

type UserResponse struct {
	Id       string    `json:"id"`
	Name     string    `json:"name"`
	Role     string    `json:"role"`
	LastSeen time.Time `json:"last_seen"`
}

type OnlineUsersResponse struct {
	Users []UserResponse `json:"users"`
	Count int            `json:"count"`
}

func (h *Hub) ServeGetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	RoomIDStr := r.URL.Query().Get("room")
	RoomID, err := strconv.Atoi(RoomIDStr)
	if err != nil {
		log.Printf("ERROR: Failed to parse RoomID for online users request :%v", err)
		http.Error(w, "Valid RoomID required", http.StatusBadRequest)
		return
	}
	users := h.HandleOnlineUsers(RoomID)
	response := OnlineUsersResponse{
		Users: users,
		Count: len(users),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Hub) HandleOnlineUsers(RoomID int) []UserResponse {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	onlineUsers := []UserResponse{}
	for user := range h.Clients {
		if user.RoomID == RoomID {
			onlineUsers = append(onlineUsers, UserResponse{
				Id:       user.ID,
				Name:     user.Name,
				Role:     user.Role,
				LastSeen: user.LastSeen,
			})
		}
	}
	return onlineUsers
}
