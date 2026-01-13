package main

import (
	"fmt"
	"net/http"
	"log"
	"github.com/gorilla/websocket"
)

type Hub struct {
	MessageChannel chan Message
	register chan *Client
	unregister chan *Client
	clients map[*Client]bool
	upgrader websocket.Upgrader
}

func NewHub() Hub {
	return Hub {
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
			case mes1, ok := <- h.MessageChannel:
			{
				if !ok {
					fmt.Print("finished")
					return;
				}
				broadcast(h, &mes1)
				fmt.Println((mes1))
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
