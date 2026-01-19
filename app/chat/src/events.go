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
	h.mutex.Lock()
	defer h.mutex.Unlock()
	for client := range h.clients {
		if client.roomId == message.ChatroomId && client.Id != clientIdIgnore {
			go func(m Message, c *Client) {
				select {
					case c.send <- m:
					case <-time.After(h.conf.BroadcastTimeout): { 
						// the timeout condition  is triggerd AFTER the channelbuffer of 200 is full, 
						// so the user is lagging, this makes zombie goroutines/connections consuming
						// cpu and by the time crashing the server
						h.unregister <- c
					}
				}		
			}(*message, client)
		}
	}
}

func sendError(userID string, h *Hub, mssg Message) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	for client := range h.clients {
		if client.Id == userID {
				select {
					case client.send <- mssg:
					default:
						log.Printf("WARNING: could not send error message to %s", userID)
				}
				return		
			}
		}
}	


func handleMessageEvent(h *Hub, EventMessage *Message) {
	EventMessage.SentTime = time.Now()
	if result := h.db.Create(EventMessage) ; result.Error != nil {
		log.Printf("DATABASE ERROR: Failed to save message: %v", result.Error)
		sendError(EventMessage.SenderId, h, Message{
			Event: "error",
			Content: "SERVER: Could not save your message, please try again.",
		})
		return
	}
	broadcast(h, EventMessage, "")
}

func handleEditEvent(h *Hub, EventMessage *Message) {
	now:= time.Now()
	result := h.db.Model(&Message{}).Where("id = ? AND writer_id = ? AND sent_at > ?",
			EventMessage.Id, EventMessage.SenderId,  now.Add(- h.conf.EditLimit)).
			Updates(map[string]any{
				"contents": EventMessage.Content,
				"edited_at": &now,
			})
	if result.Error != nil {
		log.Printf("DATABASE ERROR: Edit failed for messageID %d: %v:",EventMessage.Id, result.Error)
		sendError(EventMessage.SenderId, h, Message{
			Event: "error",
			Content: "SERVER: Could not process edit.",
		})
		return
	}
	
	if result.RowsAffected == 0 {
		log.Printf("EDIT REJECTED: Message %d for user %s not found or time limit has expired.",
				EventMessage.Id, EventMessage.SenderId)
		sendError(EventMessage.SenderId, h, Message{
			Event: "error",
			Content: "SERVER: you don't have permission to edit this message or time limit has expired.",
		})
		return
	} 
	EventMessage.IsEdited = true
	EventMessage.EditedAt = &now
	broadcast(h, EventMessage, "")
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
		log.Printf("DATABASE ERROR: Delete failed for messageID %d: %v:", EventMessage.Id, result.Error)
		sendError(EventMessage.SenderId, h, Message{
			Event: "error",
			Content: "SERVER: Could not process delete.",
		})
		return

	}
}

func handleTypingEvent(h *Hub, EventMessage *Message) {
	broadcast(h, EventMessage, EventMessage.SenderId)
}

func handleJoinEvent(h *Hub, client *Client) {
	h.mutex.Lock()
	h.clients[client] = true
	h.mutex.Unlock()
	log.Printf("INFO: user %s (ID: %s) has joined the chat", client.Name, client.Id)
	joinMssg := Message {
		Event: "join",
		Name: client.Name,
		Content: fmt.Sprintf("%s has joined the chat", client.Name),
		SentTime: time.Now(),
	}
	broadcast(h, &joinMssg, "")
}

func handleLeaveEvent(h *Hub, client *Client) {
	close(client.send)
	client.connection.Close()
	h.mutex.Lock()
	delete(h.clients, client)
	h.mutex.Unlock()
	log.Printf("INFO: user %s (ID: %s) has left the chat", client.Name, client.Id)
	leaveMssg := Message {
		Event: "leave",
		Name: client.Name,
		Content: fmt.Sprintf("%s has left the chat", client.Name),
		SentTime: time.Now(),
	}
	broadcast(h, &leaveMssg, "")
}