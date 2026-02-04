package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
	"log"
	"strings"
	"time"
	"unicode/utf8"
)

type Client struct {
	ID          string
	Name        string
	RoomID      int
	Role        string
	Hub         *Hub
	Connection  *websocket.Conn
	Send        chan Message
	RateLimiter *rate.Limiter
	LastSeen    time.Time
}

func NewClient(conn *websocket.Conn, hub *Hub, userId string, userRole string, userName string, idRoom int) *Client {
	return &Client{
		ID:          userId,
		Name:        userName,
		RoomID:      idRoom,
		Role:        userRole,
		Hub:         hub,
		Connection:  conn,
		Send:        make(chan Message, hub.Conf.ClientBuffer),
		RateLimiter: rate.NewLimiter(rate.Limit(hub.Conf.RateLimitRequest), hub.Conf.RateLimitBrust),
	}
}

func (c *Client) WriteToConnectionTunnel() {
	defer func() {
		c.Hub.Unregister <- c
	}()
	for message := range c.Send {
		if err := c.Connection.WriteJSON(message); err != nil {
			log.Printf("ERROR: user %s (ID: %s)failed to receive data due to: %v", c.Name, c.ID, err)
			return
		}
	}
}

func (c *Client) ReadFromConnectionTunnel() {
	defer func() {
		c.Hub.Unregister <- c
	}()
	for {
		var msg Message
		if err := c.Connection.ReadJSON(&msg); err != nil {
			log.Printf("ERROR: Unexpected close for user %s (ID: %s): %v", c.Name, c.ID, err)
			break
		}
		c.LastSeen = time.Now()
		if !c.RateLimiter.Allow() {
			log.Printf("WARNING: Rate limit exceeded for user %s (ID: %s)", c.Name, c.ID)
			c.Send <- Message{
				Event:   "error",
				Content: "WARNING: you are sending messages too fast. Please slow down.",
			}
			continue
		}
		cleanContent := strings.TrimSpace(msg.Content)
		contentRuneCount := utf8.RuneCountInString(cleanContent)
		if msg.Event == "message" || msg.Event == "edit" {
			if contentRuneCount == 0 {
				log.Printf("REJECT : User %s (ID: %s) sent empty message", c.Name, c.ID)
				continue
			}
			if contentRuneCount > c.Hub.Conf.MaxContentLimit {
				log.Printf("REJECT : User %s (ID: %s) messgae too long", c.Name, c.ID)
				c.Send <- Message{
					Event:   "error",
					Content: fmt.Sprintf("You exceeded the character limit (%d characters max).", c.Hub.Conf.MaxContentLimit),
				}
				continue
			}
		}
		msg.SenderID = c.ID
		msg.ChatRoomID = c.RoomID
		msg.Content = cleanContent
		c.Hub.MessageChannel <- msg
	}
}
