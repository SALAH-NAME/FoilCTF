package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"github.com/gorilla/websocket"
)

type Hub struct {
	historyTracker		map[string]Message //temporary, should switch to db 
	MessageChannel		chan Message
	register chan		*Client
	unregister			chan *Client
	clients				map[*Client]bool
	upgrader			websocket.Upgrader
	mutex				sync.Mutex
}

func NewHub() Hub {
	return Hub {
		historyTracker: make(map[string]Message),
		MessageChannel: make(chan Message),
		register: make(chan *Client, 10),
		unregister: make(chan *Client, 10),
		clients: make(map[*Client]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { //temporary
			return true
			},
		},
	}
}

func (h* Hub) serveChat(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if(err != nil) {
		log.Println("error while upgrading http connection")
		return
	}
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "Anonymous"
	}
	joinedClient := newClient(conn, h)
	joinedClient.Name = name
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
