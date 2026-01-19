package main

import (
	"fmt"
	"log"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

type Client struct {
	Id          string
	Name        string
	roomId      int
	Role        string
	hub         *Hub
	connection  *websocket.Conn
	send        chan Message
	rateLimiter *rate.Limiter
	lastSeen    time.Time
}

func newClient(conn *websocket.Conn, hub *Hub, userId string, userRole string, userName string, idRoom int) *Client {
	return &Client{
		Id:          userId,
		Name:        userName,
		roomId:      idRoom,
		Role:        userRole,
		hub:         hub,
		connection:  conn,
		send:        make(chan Message, hub.conf.ClientBuffer),
		rateLimiter: rate.NewLimiter(rate.Limit(hub.conf.RateLimitRequest), hub.conf.RateLimitBrust),
	}
}

func (c *Client) writeToConnectionTunnel() {
	defer func() {
		c.hub.unregister <- c
	}()
	for message := range c.send {
		if err := c.connection.WriteJSON(message); err != nil {
			log.Printf("ERROR: user %s (ID: %s)failed to receive data due to: %v", c.Name, c.Id, err)
			return
		}
	}
}

func (c *Client) readFromConnectionTunnel() {
	defer func() {
		c.hub.unregister <- c
	}()
	for {
		var msg Message
		if err := c.connection.ReadJSON(&msg); err != nil {
			log.Printf("ERROR: Unexpected close for user %s (ID: %s): %v", c.Name, c.Id, err)
			break
		}
		c.lastSeen = time.Now()
		if !c.rateLimiter.Allow() {
			log.Printf("WARNING: Rate limit exceeded for user %s (ID: %s)", c.Name, c.Id)
			c.send <- Message{
				Event:   "error",
				Content: "WARNING: you are sending messages too fast. Please slow down.",
			}
			continue
		}
		cleanContent := strings.TrimSpace(msg.Content)
		contentRuneCount := utf8.RuneCountInString(cleanContent)
		if msg.Event == "message" || msg.Event == "edit" {
			if contentRuneCount == 0 {
				log.Printf("REJECT : User %s (ID: %s) sent empty message", c.Name, c.Id)
				continue
			}
			if contentRuneCount > c.hub.conf.MaxContentLimit {
				log.Printf("REJECT : User %s (ID: %s) messgae too long", c.Name, c.Id)
				c.send <- Message{
					Event:   "error",
					Content: fmt.Sprintf("You exceeded the character limit (%d characters max).", c.hub.conf.MaxContentLimit),
				}
				continue
			}
		}
		msg.SenderId = c.Id
		msg.ChatroomId = c.roomId
		msg.Content = cleanContent
		c.hub.MessageChannel <- msg
	}
}
