package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"strconv"
)

type Hub struct {
	db					*gorm.DB
	MessageChannel		chan Message
	register chan		*Client
	unregister			chan *Client
	clients				map[*Client]bool
	upgrader			websocket.Upgrader
	mutex				sync.Mutex
}

func NewHub(database *gorm.DB) *Hub {
	return &Hub {
		db:					database,
		MessageChannel: 	make(chan Message),
		register: 			make(chan *Client, 10),
		unregister: 		make(chan *Client, 10),
		clients: 			make(map[*Client]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { //temporary
			return true
			},
		},
	}
}

func (h* Hub) serveChat(w http.ResponseWriter, r *http.Request) {

	userIDstr := r.Header.Get("X-User-Id")
	userRole := r.Header.Get("X-User-Role")
	userName := r.Header.Get("X-User-Name")

	userID, err := strconv.Atoi(userIDstr)
	if err != nil {
		http.Error(w, "Unauthorized: Missing user ID",  http.StatusUnauthorized)
		return
	}
	if userRole != "organizer" && userRole != "participant" {
		http.Error(w, "Forbidden",  http.StatusForbidden)
		return		
	}
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if(err != nil) {
		log.Println("error while upgrading http connection")
		return
	}
	roomIdStr := r.URL.Query().Get("room")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		http.Error(w, "valid roomID is required",  http.StatusBadRequest)
		return
	}
	
	joinedClient := newClient(conn, h, userID, userRole, userName, roomId)
	h.register <- joinedClient
	go joinedClient.writeToConnectionTunnel()
	go joinedClient.readFromConnectionTunnel()
}

func (h *Hub) Run() {

	for {
		select {
			case EventMessage, ok := <- h.MessageChannel:
			{
				if !ok {
					fmt.Print("salat lhfla")
					return;
				}
				switch(EventMessage.Event) {
					case "message": {
						handleMessageEvent(h, &EventMessage)
					}
					case "typing": {
						handleTypingEvent(h, &EventMessage)
					}
					case "edit": {
						handleEditEvent(h, &EventMessage)
					}
					case "delete": {
						handleDeleteEvent(h, &EventMessage)
					}
				}
				fmt.Println((EventMessage))
			}
			case client := <- h.register: {
				handleJoinEvent(h, client)
			}
			case client := <- h.unregister: {
				handleLeaveEvent(h, client)
			}
		}

	}

}
