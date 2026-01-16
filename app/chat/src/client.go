package main

import (
	"log"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

type Client struct {
	Id				string
	Name			string
	roomId			int
	Role			string
	h				*Hub
	connection 		*websocket.Conn
	send chan 		Message
	rateLimiter		*rate.Limiter
	lastSeen		time.Time
}

func newClient(conn *websocket.Conn, hub *Hub, userId string, userRole string, userName string, idRoom int) *Client{
	return &Client {
		Id:				userId,
		Name:			userName,
		roomId: 		idRoom,
		Role: 			userRole,
		h: 				hub,
		connection: 	conn,
		send:			make(chan Message),
		rateLimiter:	rate.NewLimiter(3, 6),
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
		c.lastSeen = time.Now()
		if !c.rateLimiter.Allow() {
			log.Printf("user %s is spamming!", c.Name)
			continue
		}
		cleanContent := strings.TrimSpace(msg.Content)
		if (msg.Event == "message" || msg.Event == "edit" ) && (cleanContent == ""  || utf8.RuneCountInString(cleanContent) > 500) {
			log.Printf("user %s sent either an empty or exceeding limit message", c.Name)
			continue
		}
		msg.SenderId = c.Id
		msg.ChatroomId = c.roomId
		msg.Content = cleanContent
		c.h.MessageChannel <- msg
	}
}