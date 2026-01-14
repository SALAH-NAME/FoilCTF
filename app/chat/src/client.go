package main

import (
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)


type Client struct {
	Id			string
	Name		string
	Role		string
	h			*Hub
	connection 	*websocket.Conn
	send chan 	Message
}

func newClient(conn *websocket.Conn, hub *Hub) *Client{
	return &Client {
		Id: uuid.New().String(),
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
		msg.SenderId = c.Id
		c.h.MessageChannel <- msg
	}
}