package main

import (
	"fmt"
	"log"
	"time"

)

type Message struct {
	Id			uint		`json:"id" gorm:"primaryKey;column:id"`
	SenderId	string		`json:"sender_id,omitempty" gorm:"column:writer_id"`
	ChatroomId	int			`json:"chatroom_id" gorm:"column:chatroom_id"`
	SentTime 	time.Time	`json:"sent_time" gorm:"column:sent_at"`
	Content 	string		`json:"content" gorm:"column:contents"`
	Event 		string		`json:"event" gorm:"-"`
	Name 		string		`json:"name" gorm:"-"`
	IsEdited 	bool		`json:"is_edited" gorm:"-"`
	EditedAt 	*time.Time	`json:"edited_at,omitempty" gorm:"-"`
	DeletedAt 	*time.Time	`json:"deleted_at,omitempty" gorm:"index"`
}

func broadcast(h *Hub, message *Message, clientIdIgnore string) {
	for client := range h.clients {
		if client.roomId == message.ChatroomId && client.Id != clientIdIgnore {
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
}

func handleMessageEvent(h *Hub, EventMessage *Message) {
	EventMessage.SentTime = time.Now()
	if result := h.db.Create(EventMessage) ; result.Error != nil {
		log.Printf("DB Error: %v", result.Error)
		return
	}
	broadcast(h, EventMessage, "")
}

func handleEditEvent(h *Hub, EventMessage *Message) {
	now:= time.Now()
	result := h.db.Model(&Message{}).Where("id = ? AND writer_id = ? AND sent_at > ?",
			EventMessage.Id, EventMessage.SenderId,  now.Add(-1 * time.Minute)).
			Updates(map[string]any{
				"contents": EventMessage.Content,
				"edited_at": &now,
			})
	if result.Error == nil && result.RowsAffected > 0 {
		EventMessage.IsEdited = true
		EventMessage.EditedAt = &now
		broadcast(h, EventMessage, "")
	} else {
		log.Print("Edit failed")
	}
}

func handleDeleteEvent(h *Hub, EventMessage *Message) {
	now:= time.Now()
	result := h.db.Model(&Message{}).Where("id = ? AND writer_id = ?",
			EventMessage.Id, EventMessage.SenderId).
			Updates(map[string]any{
				"deleted_at": &now,
			})
		if result.Error == nil && result.RowsAffected > 0 {
		EventMessage.Event = "delete"
		broadcast(h, EventMessage, "")
	} else {
		log.Print("Delete failed")
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