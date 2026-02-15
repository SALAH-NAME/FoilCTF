package main

import (
	"github.com/gorilla/websocket"
	"log"
)

type Client struct {
	ID         *int
	EventID    int
	Connection *websocket.Conn
	Send       chan WsEvent
	Hub        *Hub
}

func NewClient(id *int, conn *websocket.Conn, eventID int, hub *Hub) *Client {
	return &Client{
		ID:         id,
		EventID:    eventID,
		Connection: conn,
		Send:       make(chan WsEvent, hub.Conf.ClientBuffer),
		Hub:        hub,
	}
}

func (client *Client) WriteData() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for event := range client.Send {
		if err := client.Connection.WriteJSON(event); err != nil {
			log.Printf("ERROR: failed to receive data due to: %v", err)
			return
		}
	}
}

func (client *Client) ReadData() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for {
		var event WsEvent
		if err := client.Connection.ReadJSON(&event); err != nil {
			log.Printf("ERROR: Unexpected close : %v", err)
			break
		}
		client.Hub.GlobalChan <- event
	}
}

func (client *Client) LogId() any {
	if client.ID == nil {
		return "guest"
	}
	return *client.ID
}
