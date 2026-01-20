package service

import (
	"github.com/gorilla/websocket"
	"notification-service/model"

)
type Client struct {
	ID			string
	Role        string
	Connection	*websocket.Conn
	Send		chan model.NotificationResponse
	Hub			*Hub
	
}

func NewClient(id string, role string, conn *websocket.Conn, hub *Hub) *Client{
	return &Client{
		ID: id,
		Role: role,
		Connection: conn,
		Send: make(chan model.NotificationResponse, hub.Conf.ClientBuffer),
		Hub: hub,
	}
}

func (client *Client) WriteToConnectionTunnel() {
	
}

func (client *Client) ReadFromConnectionTunnel() {

}