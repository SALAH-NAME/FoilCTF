package main

import (
	"encoding/json"
	"net/http"
	"time"
	"log"
)

type UserResponse struct {
	Id			string			`json:"id"`
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
	
	users := h.HandleOnlineUsers()
	response := onlineUsersResponse {
		Users : users,
		Count : len(users),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

func (h *Hub) HandleOnlineUsers() []UserResponse {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	var onlineUsers  []UserResponse 
	for user := range h.clients {
		onlineUsers = append(onlineUsers, UserResponse{
			Id: 		user.Id,
			Name: 		user.Name,
			Role: 		user.Role,
			LastSeen: 	user.lastSeen,
		})
	}
	return onlineUsers
}