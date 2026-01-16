package main

import (
	"log"
	"golang.org/x/time/rate"
	"github.com/gorilla/websocket"
)

type Client struct {
	Id			int
	Name		string
	roomId		int
	Role		string
	h			*Hub
	connection 	*websocket.Conn
	send chan 	Message
	rateLimiter *rate.Limiter
}

func newClient(conn *websocket.Conn, hub *Hub, userId int, userRole string, userName string, idRoom int) *Client{
	return &Client {
		Id: userId,
		Name: userName,
		roomId: idRoom,
		Role: userRole,
		h: hub,
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
			continue
		}
		msg.SenderId = c.Id
		msg.ChatroomId = c.roomId
		c.h.MessageChannel <- msg
	}
}