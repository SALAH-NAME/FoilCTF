package main

import (
	"time"
)

type Message struct {
	Name string
	Content string
	SentTime time.Time
}

func broadcast(h *Hub, message *Message) {
	for client := range h.clients {
		select {
			case client.send <- *message:
			default:
			{
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}