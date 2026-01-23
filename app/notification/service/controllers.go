package service

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)
func getUserInfo(r *http.Request) (string, string) {
	userID := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")
	return userID, userRole
}

func (hub *Hub)ServWs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Print("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID, userRole := getUserInfo(r)
	connection, err := hub.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(userID, userRole, connection, hub)
	hub.RegisterChan <- joinedClient
	go joinedClient.ReadFromConnectionTunnel()
	go joinedClient.WriteToConnectionTunnel()
}

func (hub *Hub)ServeList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Print("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID, _ := getUserInfo(r)
	limit := 10 
	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	ListNotifications(userID, limit, hub, w)
}

func (hub *Hub)ServeMarkAsRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		log.Print("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID, _ := getUserInfo(r)
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) == 3 {
		notificationIDStr := parts[2]
		notificationID, err := strconv.Atoi(notificationIDStr)
		if err != nil {
			log.Printf("ERROR: Failed to parse notificationID :%v", err)
			http.Error(w, "Valid notificationID required", http.StatusBadRequest)
			return
		}
		MarkSingleNotification(userID, notificationID, hub, w)
	} else {
		MarkAllNotification(userID, hub, w)
	}
}