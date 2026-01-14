package main

import (
	// "fmt"
	// "log"
	"encoding/json"
	"net/http"
	// "github.com/gorilla/websocket"
)

type UserRespose struct {
	Id		string `json:"id"`
	Name	string `json:"name"`
	Role	string `json:"role"`
}

type onlineUsersResponse struct {
	Users	[]UserRespose 	`json:"users"`
	Count	int				`json:"count"`
}

func (h *Hub) serveGetUsers(w http.ResponseWriter, r *http.Request) {
	users := h.HandleOnlineUsers()
	response := onlineUsersResponse {
		Users : users,
		Count : len(users),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}

func (h *Hub) HandleOnlineUsers() []UserRespose {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	var onlineUsers  []UserRespose 
	for user := range h.clients {
		onlineUsers = append(onlineUsers, UserRespose{
			Id: user.Id,
			Name: user.Name,
			Role: user.Role,
		})
	}
	return onlineUsers
}