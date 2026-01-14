package main

import (
	"time"
)

type Message struct {
	Id			string		`json:"id"`
	SenderId	string		`json:"sender_id,omitempty"`
	Event 		string		`json:"event"`
	Name 		string		`json:"name"`
	Content 	string		`json:"content"`
	SentTime 	time.Time	`json:"sent_time"`
	IsEdited 	bool		`json:"is_edited"`
	EditedAt 	*time.Time	`json:"edited_at,omitempty"`
	DeletedAt 	*time.Time	`json:"deleted_at,omitempty"`
}

func broadcast(h *Hub, message *Message, clientIdIgnore string) {
	for client := range h.clients {
		if client.Id == clientIdIgnore {
			continue
		}
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

