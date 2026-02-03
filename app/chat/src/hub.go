package main

import (
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
	Clients        map[*Client]bool
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
		Clients:        make(map[*Client]bool),
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { //temporary
				return true
			},
		},
	}
}

func (h *Hub) ServeChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")
	userName := r.Header.Get("X-User-Name")

	conn, err := h.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	roomIDStr := r.URL.Query().Get("room")
	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		log.Printf("ERROR: Valid RoomID is required")
		http.Error(w, "Valid RoomID is required", http.StatusBadRequest)
		return
	}

	joinedClient := NewClient(conn, h, userID, userRole, userName, roomID)
	h.Register <- joinedClient
	go joinedClient.WriteToConnectionTunnel()
	go joinedClient.ReadFromConnectionTunnel()
}

func (h *Hub) TrackChannels() {

	for {
		select {
		case eventMessage, ok := <-h.MessageChannel:
			{
				if !ok {
					log.Print("Global Message channel closed")
					return
				}
				switch eventMessage.Event {
				case "message":
					HandleMessageEvent(h, &eventMessage)
				case "typing":
					HandleTypingEvent(h, &eventMessage)
				case "edit":
					HandleEditEvent(h, &eventMessage)
				case "delete":
					HandleDeleteEvent(h, &eventMessage)
				default:
					log.Printf("ERROR: Unknown event type received %s", eventMessage.Event)
				}
			}
		case client := <-h.Register:
			HandleJoinEvent(h, client)
		case client := <-h.Unregister:
			{
				if _, ok := h.Clients[client]; ok {
					HandleLeaveEvent(h, client)
				}
			}
		}

	}
}
