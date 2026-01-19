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
	conf			*config
	MessageChannel chan Message
	register       chan *Client
	unregister     chan *Client
	clients        map[*Client]bool
	upgrader       websocket.Upgrader
	mutex          sync.Mutex
}

func NewHub(database *gorm.DB, conf	*config) *Hub {
	return &Hub{
		db:             database,
		conf: 			conf,
		MessageChannel: make(chan Message, conf.GlobalBuffer),
		register:       make(chan *Client, conf.RegisterBuffer),
		unregister:     make(chan *Client, conf.RegisterBuffer),
		clients:        make(map[*Client]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { //temporary
				return true
			},
		},
	}
}

func (h *Hub) serveChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("HTTP ERROR: Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID   := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")
	userName := r.Header.Get("X-User-Name")
	
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	roomIdStr := r.URL.Query().Get("room")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		log.Printf("ERROR: Valid roomID is required")
		http.Error(w, "Valid roomID is required", http.StatusBadRequest)
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
					log.Print("Global Message channel closed")
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
						log.Printf("ERROR: Unknown event type received %s", EventMessage.Event)
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
