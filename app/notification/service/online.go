package service

import (
	"encoding/json"
	"net/http"
)

type OnlineUsersResponse struct {
	Usernames []string `json:"usernames"`
	Count     int      `json:"count"`
}

func (hub *Hub) HandleOnlineUsers(w http.ResponseWriter, r *http.Request) {
	hub.Mutex.Lock()
	seen := make(map[string]bool)
	for _, connections := range hub.Clients {
		for client := range connections {
			if client.UserName != "" {
				seen[client.UserName] = true
			}
		}
	}
	hub.Mutex.Unlock()

	usernames := make([]string, 0, len(seen))
	for name := range seen {
		usernames = append(usernames, name)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(OnlineUsersResponse{
		Usernames: usernames,
		Count:     len(usernames),
	})
}
