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
	db             *gorm.DB
	MessageChannel chan Message
	register       chan *Client
	unregister     chan *Client
	clients        map[*Client]bool
	upgrader       websocket.Upgrader
	mutex          sync.Mutex
}

func NewHub(database *gorm.DB) *Hub {
	return &Hub{
		db:             database,
		MessageChannel: make(chan Message),
		register:       make(chan *Client, 10),
		unregister:     make(chan *Client, 10),
		clients:        make(map[*Client]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { //temporary
				return true
			},
		},
	}
}

func (h *Hub) serveChat(w http.ResponseWriter, r *http.Request) {

	userID   := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")
	userName := r.Header.Get("X-User-Name")

	if userRole != "organizer" && userRole != "participant" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("error while upgrading http connection")
		return
	}
	roomIdStr := r.URL.Query().Get("room")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		http.Error(w, "valid roomID is required", http.StatusBadRequest)
		return
	}

	joinedClient := newClient(conn, h, userID, userRole, userName, roomId)
	h.register <- joinedClient
	go joinedClient.writeToConnectionTunnel()
	go joinedClient.readFromConnectionTunnel()
}

func (h *Hub) TrackChannels() {

	for {
		select {
		case EventMessage, ok := <-h.MessageChannel: {
				if !ok {
					log.Print("Message channel closed")
					return
				}
				switch EventMessage.Event {
					case "message":
						handleMessageEvent(h, &EventMessage)
					case "typing":
						handleTypingEvent(h, &EventMessage)
					case "edit":
						handleEditEvent(h, &EventMessage)
					case "delete":
						handleDeleteEvent(h, &EventMessage)
					default :
						log.Printf("Unknown event type received %s", EventMessage.Event)
				}
		}
		case client := <-h.register:
			handleJoinEvent(h, client)
		case client := <-h.unregister: {
			if _, ok := h.clients[client]; ok {
				handleLeaveEvent(h, client)
			}
		}
		}

	}
}
