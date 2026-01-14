package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Hub struct {
	historyTracker map[string]Message //temporary, should switch to db 
	MessageChannel chan Message
	register chan *Client
	unregister chan *Client
	clients map[*Client]bool
	upgrader websocket.Upgrader
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

func (h* Hub) serveWs(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if(err != nil) {
		log.Println("error while upgrading http connection")
		return
	}
	joinedClient := newClient(conn, h)
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
						EventMessage.Id = uuid.New().String()
						EventMessage.SentTime = time.Now()
						h.historyTracker[EventMessage.Id] = EventMessage
						broadcast(h, &EventMessage, "")
					}
					case "typing": {
						broadcast(h, &EventMessage, EventMessage.SenderId)
					}
					case "edit": {
						oldMessage, exists := h.historyTracker[EventMessage.Id]
						if exists && (oldMessage.DeletedAt == nil){
							if(time.Since(oldMessage.SentTime).Minutes() < 1) {
								now:= time.Now()
								oldMessage.EditedAt = &now
								oldMessage.Content = EventMessage.Content
								oldMessage.IsEdited = true
								broadcast(h, &oldMessage, "")
							}
						}
					}
					case "delete": {
						oldMessage, exists := h.historyTracker[EventMessage.Id]
						if exists && (oldMessage.DeletedAt == nil){
							now:= time.Now()
							oldMessage.DeletedAt = &now
							h.historyTracker[oldMessage.Id] = oldMessage
						}
					}
				}
				fmt.Println((EventMessage))
			}
			case mes2 := <- h.register:
			{
				h.clients[mes2] = true
				fmt.Println("hello ", mes2)
			}
			case mes3 := <- h.unregister:
			{
				delete(h.clients, mes3)
				fmt.Println("goodbye", mes3)
			}
		}

	}

}
