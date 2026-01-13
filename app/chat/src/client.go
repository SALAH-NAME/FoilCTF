package main

import (
	"log"

	"github.com/gorilla/websocket"
)


type Client struct {
	h *Hub
	connection *websocket.Conn
	send chan Message
}

func newClient(conn *websocket.Conn, hub *Hub) *Client{
	return &Client {
		h: hub,
		connection: conn,
		send: make(chan Message),
	}
}

func (c *Client) writeToConnectionTunnel(){
	for message := range c.send {
		err := c.connection.WriteJSON(message)
		if(err != nil) {	
			return 
		}
	}
}

func (c *Client) readFromConnectionTunnel() {
	defer func() {
		c.h.unregister <- c
		close(c.send)
		c.connection.Close()
	}()
	for {
		var msg Message
		err := c.connection.ReadJSON(&msg)
		if(err != nil) {
			log.Println("something went wrong while sending the message")
			break;
		}
		c.h.MessageChannel <- msg
	}
}