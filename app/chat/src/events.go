package main

import (
	"fmt"
	"log"
	"time"
)

type Message struct {
	Id         uint       `json:"id" gorm:"primaryKey;column:id"`
	SenderID   string     `json:"sender_id,omitempty" gorm:"column:writer_id"`
	ChatRoomID int        `json:"chatroom_id" gorm:"column:chatroom_id"`
	SentTime   time.Time  `json:"sent_time" gorm:"column:sent_at"`
	Content    string     `json:"content" gorm:"column:contents"`
	Event      string     `json:"event" gorm:"-"`
	Name       string     `json:"name" gorm:"-"`
	IsEdited   bool       `json:"is_edited" gorm:"-"`
	EditedAt   *time.Time `json:"edited_at,omitempty" gorm:"-"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty" gorm:"index"`
}

func GetClients(h *Hub, message *Message, clientIdIgnore string) []*Client {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	targets := []*Client{}
	for userID, connections := range h.Clients {
		if userID == clientIdIgnore {
			continue
		}
		for client := range connections {
			if client.RoomID == message.ChatRoomID {
				targets = append(targets, client)
			}
		}
	}
	return targets
}

func Broadcast(h *Hub, message *Message, clientIdIgnore string) {
	targets := GetClients(h, message, clientIdIgnore)

	for _, client := range targets {
		go func(m Message, c *Client) {
			select {
			case c.Send <- m:
			case <-time.After(h.Conf.BroadcastTimeout):
				log.Printf("User %s timed out", c.Name)
				h.Unregister <- c
			}
		}(*message, client)
	}
}

func SendError(userID string, h *Hub, mssg Message) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	if connections, ok := h.Clients[userID]; ok {
		for client := range connections {
			select {
			case client.Send <- mssg:
			default:
				log.Printf("WARNING: could not send error message to %s", userID)
				return
			}
		}
	}
}

func HandleMessageEvent(h *Hub, eventMessage *Message) {
	eventMessage.SentTime = time.Now()
	err := h.Db.Create(eventMessage).Error

	if err != nil {
		log.Printf("DATABASE ERROR: Failed to save message: %v", err)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "SERVER: Could not save your message, please try again.",
		})
		return
	}
	Broadcast(h, eventMessage, "")
}

func HandleEditEvent(h *Hub, eventMessage *Message) {
	now := time.Now()
	result := h.Db.Model(&Message{}).Where("id = ? AND writer_id = ? AND sent_at > ?",
		eventMessage.Id, eventMessage.SenderID, now.Add(-h.Conf.EditLimit)).
		Updates(map[string]any{
			"contents":  eventMessage.Content,
			"edited_at": &now,
		})
	if result.Error != nil {
		log.Printf("DATABASE ERROR: Edit failed for messageID %d: %v:", eventMessage.Id, result.Error)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "SERVER: Could not process edit.",
		})
		return
	}

	if result.RowsAffected == 0 {
		log.Printf("EDIT REJECTED: Message %d for user %s not found or time limit has expired.",
			eventMessage.Id, eventMessage.SenderID)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "SERVER: you don't have permission to edit this message or time limit has expired.",
		})
		return
	}
	eventMessage.IsEdited = true
	eventMessage.EditedAt = &now
	Broadcast(h, eventMessage, "")
}

func HandleDeleteEvent(h *Hub, eventMessage *Message) {
	now := time.Now()
	result := h.Db.Model(&Message{}).Where("id = ? AND writer_id = ?",
		eventMessage.Id, eventMessage.SenderID).
		Updates(map[string]any{
			"deleted_at": &now,
		})
	if result.Error == nil && result.RowsAffected > 0 {
		eventMessage.Event = "delete"
		Broadcast(h, eventMessage, "")
	} else {
		log.Printf("DATABASE ERROR: Delete failed for messageID %d: %v:", eventMessage.Id, result.Error)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "SERVER: Could not process delete.",
		})
		return

	}
}

func HandleTypingEvent(h *Hub, eventMessage *Message) {
	Broadcast(h, eventMessage, eventMessage.SenderID)
}

func HandleJoinEvent(h *Hub, client *Client) {
	h.Mutex.Lock()
	if _, ok := h.Clients[client.ID]; !ok {
		h.Clients[client.ID] = make(map[*Client]bool)
	}
	h.Clients[client.ID][client] = true
	h.Mutex.Unlock()
	log.Printf("INFO: user %s (ID: %s) has joined the chat", client.Name, client.ID)

	joinMssg := Message{
		Event:      "join",
		Name:       client.Name,
		ChatRoomID: client.RoomID,
		Content:    fmt.Sprintf("%s has joined the chat", client.Name),
		SentTime:   time.Now(),
	}
	Broadcast(h, &joinMssg, "")
}

func RemoveClient(h *Hub, client *Client) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	connections, ok := h.Clients[client.ID]
	if !ok {
		return
	}
	if _, exits := connections[client]; !exits {
		return
	}
	delete(connections, client)
	if len(connections) == 0 {
		delete(h.Clients, client.ID)
	}
	client.Connection.Close()
	close(client.Send)
}

func HandleLeaveEvent(h *Hub, client *Client) {
	RemoveClient(h, client)
	leaveMssg := Message{
		Event:      "leave",
		Name:       client.Name,
		ChatRoomID: client.RoomID,
		Content:    fmt.Sprintf("%s has left the chat", client.Name),
		SentTime:   time.Now(),
	}
	Broadcast(h, &leaveMssg, "")
}
