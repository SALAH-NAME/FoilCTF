package service

import (
	"log"

	"github.com/gorilla/websocket"
	"kodaic.ma/notification/model"
)

type Client struct {
	ID         string
	Role       string
	Connection *websocket.Conn
	Send       chan model.WsEvent
	Hub        *Hub
}

func NewClient(id string, role string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:         id,
		Role:       role,
		Connection: conn,
		Send:       make(chan model.WsEvent, hub.Conf.ClientBuffer),
		Hub:        hub,
	}
}

func (client *Client) WriteToConnectionTunnel() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for event := range client.Send {
		if err := client.Connection.WriteJSON(event); err != nil {
			log.Printf("ERROR: userID: %s failed to receive data due to: %v", client.ID, err)
			return
		}
	}
}

func (client *Client) ReadFromConnectionTunnel() {
	defer func() {
		client.Hub.UnregisterChan <- client
	}()
	for {
		var event model.WsEvent
		if err := client.Connection.ReadJSON(&event); err != nil {
			log.Printf("ERROR: Unexpected close for userID: %s: %v", client.ID, err)
			break
		}
		client.Hub.GlobalChan <- event
	}
}
