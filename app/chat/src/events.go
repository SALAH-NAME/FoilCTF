package main

import (
	"time"
	"fmt"
	"github.com/google/uuid"
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

func handleMessageEvent(h *Hub, EventMessage *Message) {
	EventMessage.Id = uuid.New().String()
	EventMessage.SentTime = time.Now()
	h.historyTracker[EventMessage.Id] = *EventMessage
	broadcast(h, EventMessage, "")
}

func handleEditEvent(h *Hub, EventMessage *Message) {
	oldMessage, exists := h.historyTracker[EventMessage.Id]
	if exists && (oldMessage.DeletedAt == nil){
		if(time.Since(oldMessage.SentTime).Minutes() < 1) {
			now:= time.Now()
			oldMessage.EditedAt = &now
			oldMessage.Content = EventMessage.Content
			oldMessage.IsEdited = true
			broadcast(h, &oldMessage, "")
		}
	}
}

func handleDeleteEvent(h *Hub, EventMessage *Message) {
	oldMessage, exists := h.historyTracker[EventMessage.Id]
	if exists && (oldMessage.DeletedAt == nil){
		now:= time.Now()
		oldMessage.DeletedAt = &now
		h.historyTracker[oldMessage.Id] = oldMessage
	}
}

func handleTypingEvent(h *Hub, EventMessage *Message) {
	broadcast(h, EventMessage, EventMessage.SenderId)
}

func handleJoinEvent(h *Hub, client *Client) {
	h.clients[client] = true
	fmt.Println("hello ", client)
	joinMssg := Message {
		Event: "join",
		Name: client.Name,
		Content: fmt.Sprintf("%s has joined the chat", client.Name),
		SentTime: time.Now(),
	}
	broadcast(h, &joinMssg, "")
}

func handleLeaveEvent(h *Hub, client *Client) {
	delete(h.clients, client)
	fmt.Println("goodbye", client)
	leaveMssg := Message {
	Event: "leave",
	Name: client.Name,
	Content: fmt.Sprintf("%s has left the chat", client.Name),
	SentTime: time.Now(),
	}
	broadcast(h, &leaveMssg, "")
}