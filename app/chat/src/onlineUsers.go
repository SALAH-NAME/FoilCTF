package main

import (
	"encoding/json"
	"net/http"
	"time"
	"log"
	"strconv"
)

type UserResponse struct {
	Id			string		`json:"id"`
	Name		string		`json:"name"`
	Role		string 		`json:"role"`
	LastSeen 	time.Time	`json:"last_seen"`
}

type onlineUsersResponse struct {
	Users	[]UserResponse 	`json:"users"`
	Count	int				`json:"count"`
}

func (h *Hub) serveGetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	roomIdStr := r.URL.Query().Get("room")
	roomID, err := strconv.Atoi(roomIdStr)
	if err != nil {
		log.Printf("ERROR: Failed to parse roomID for online users request :%v", err)
		http.Error(w, "Valid roomID required",  http.StatusBadRequest)
		return
	}
	users := h.HandleOnlineUsers(roomID)
	response := onlineUsersResponse {
		Users : users,
		Count : len(users),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Hub) HandleOnlineUsers(roomID int) []UserResponse {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	onlineUsers := []UserResponse{}
	for user := range h.clients {
		if user.roomId == roomID {
			onlineUsers = append(onlineUsers, UserResponse{
				Id: 		user.Id,
				Name: 		user.Name,
				Role: 		user.Role,
				LastSeen: 	user.lastSeen,
			})
		}
	}
	return onlineUsers
}