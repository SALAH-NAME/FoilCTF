package service

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID         int
	UserName   string
	Role       string
	Connection *websocket.Conn
	Send       chan WsEvent
	Hub        *Hub
}

func NewClient(id int, username, role string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:         id,
		UserName:   username,
		Role:       role,
		Connection: conn,
		Send:       make(chan WsEvent, hub.Conf.ClientBuffer),
		Hub:        hub,
	}
}

func (client *Client) WriteToConnectionTunnel() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for event := range client.Send {
		if err := client.Connection.WriteJSON(event); err != nil {
			log.Printf("ERROR: User#%03d failed to receive data due to: %v", client.ID, err)
			return
		}
	}
}

func (client *Client) ReadFromConnectionTunnel() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for {
		var event WsEvent
		if err := client.Connection.ReadJSON(&event); err != nil {
			log.Printf("ERROR: User#%03d was unexpectedly terminated: %v", client.ID, err)
			break
		}
		client.Hub.GlobalChan <- event
	}
}
