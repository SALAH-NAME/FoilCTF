package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type Hub struct {
	Db             *gorm.DB
	Conf           *Config
	MessageChannel chan Message
	Register       chan *Client
	Unregister     chan *Client
	Clients        map[string]map[*Client]bool
	Upgrader       websocket.Upgrader
	Mutex          sync.Mutex
}

func NewHub(database *gorm.DB, conf *Config) *Hub {
	return &Hub{
		Db:             database,
		Conf:           conf,
		MessageChannel: make(chan Message, conf.GlobalBuffer),
		Register:       make(chan *Client, conf.RegisterBuffer),
		Unregister:     make(chan *Client, conf.RegisterBuffer),
		Clients:        make(map[string]map[*Client]bool),
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func GetUserInfo(r *http.Request) (string, string, string, error) {
	userID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		return "", "", "", fmt.Errorf("UserId not found in this context")
	}
	userName, ok := r.Context().Value(usernameKey).(string)
	if !ok {
		return "", "", "", fmt.Errorf("Username not found in this context")
	}
	userRole, ok := r.Context().Value(userRoleKey).(string)
	if !ok {
		return "", "", "", fmt.Errorf("userRole not found in this context")
	}
	return userID, userName, userRole, nil
}

func (h *Hub) ServeChat(w http.ResponseWriter, r *http.Request) {
	userID, userName, userRole, err := GetUserInfo(r)
	if err != nil {
		log.Printf("DEBUG: SERVER: user info required %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	roomIDStr := r.URL.Query().Get("room")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		log.Printf("DEBUG: SERVER: Valid RoomID is required")
		JSONError(w, "Valid RoomID is required", http.StatusBadRequest)
		return
	}
	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("DEBUG: SERVER: Upgrading http connection failed : %v", err)
		JSONError(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(conn, h, userID, userRole, userName, roomID)
	go joinedClient.WriteToConnectionTunnel()
	go joinedClient.ReadFromConnectionTunnel()
	h.Register <- joinedClient
}

func (h *Hub) TrackChannels() {
	for {
		select {
		case eventMessage, ok := <-h.MessageChannel:
			{
				if !ok {
					log.Print("DEBUG: EVENTS: Global Message channel closed")
					return
				}
				switch eventMessage.Event {
				case "message":
					websocketMessagesTotal.Inc()
					websocketEventsTotal.WithLabelValues("message").Inc()
					HandleMessageEvent(h, &eventMessage)
				case "typing":
					websocketEventsTotal.WithLabelValues("typing").Inc()
					HandleTypingEvent(h, &eventMessage)
				case "edit":
					websocketEventsTotal.WithLabelValues("edit").Inc()
					HandleEditEvent(h, &eventMessage)
				case "delete":
					websocketEventsTotal.WithLabelValues("delete").Inc()
					HandleDeleteEvent(h, &eventMessage)
				default:
					log.Printf("ERROR: EVENTS: Unknown event type received %q", eventMessage.Event)
				}
			}
		case client := <-h.Register:
			websocketConnectedClients.Inc()
			HandleJoinEvent(h, client)
		case client := <-h.Unregister:
			websocketConnectedClients.Dec()
			HandleLeaveEvent(h, client)
		}
	}
}

func (h *Hub) ServeHealth(w http.ResponseWriter, r *http.Request) {
	_ = r
	w.WriteHeader(http.StatusOK)
}
