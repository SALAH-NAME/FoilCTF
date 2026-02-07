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
	RoomIDStr := r.URL.Query().Get("room")
	RoomID, err := strconv.Atoi(RoomIDStr)
	if err != nil {
		log.Printf("ERROR: Failed to parse RoomID for online users request :%v", err)
		JSONError(w, "Valid RoomID required", http.StatusBadRequest)
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
	seenUsers := make(map[string]bool)

	for userID, connections := range h.Clients {
		if seenUsers[userID] {
			continue
		}

		for user := range connections {
			if user.RoomID == RoomID {
				resp := UserResponse{
					Id:       user.ID,
					Name:     user.Name,
					Role:     user.Role,
					LastSeen: user.LastSeen,
				}
				onlineUsers = append(onlineUsers, resp)
				seenUsers[userID] = true
				break
			}
		}
	}
	return onlineUsers
}
