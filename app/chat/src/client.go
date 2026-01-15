package main

import (
	"log"
	"golang.org/x/time/rate"
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
	rateLimiter *rate.Limiter
}

func newClient(conn *websocket.Conn, hub *Hub) *Client{
	return &Client {
		Id: uuid.New().String(),
		h: hub,
		Role: "", //temporary
		connection: conn,
		send: make(chan Message),
		rateLimiter: rate.NewLimiter(3, 6),
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
		if !c.rateLimiter.Allow() {
			log.Printf("user %s is spamming!", c.Name)
			continue // ignore spamming users or should i send them to unregister channel? emm
		}
		msg.SenderId = c.Id
		c.h.MessageChannel <- msg
	}
}