package main

import (
	"fmt"
	"log"
	"strconv"
	"time"
)

type Message struct {
	Id         uint       `json:"id" gorm:"primaryKey;column:id"`
	SenderID   string     `json:"sender_id,omitempty" gorm:"-"`
	WriterID   *int64     `json:"-" gorm:"column:writer_id"`
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
			if client.RoomID == message.ChatRoomID && !client.IsClosed() {
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
			if !c.SafeSend(m, h.Conf.BroadcastTimeout) {
				log.Printf("ERROR: WEBSOCKET: Unregistering client %q due to failure during broadcast", c.Name)
				h.Unregister <- c
			}
		}(*message, client)
	}
}

func SendError(userID string, h *Hub, mssg Message) {
	h.Mutex.Lock()
	var clientList []*Client
	if connections, ok := h.Clients[userID]; ok {
		for client := range connections {
			clientList = append(clientList, client)
		}
	}
	h.Mutex.Unlock()

	for _, client := range clientList {
		if !client.SafeSend(mssg, 100*time.Millisecond) {
			log.Printf("WARNING: WEBSOCKET: could not send error message to %q: either the channel is closed or full", userID)
		}
	}
}

func HandleMessageEvent(h *Hub, eventMessage *Message) {
	eventMessage.SentTime = time.Now()

	if id, err := strconv.ParseInt(eventMessage.SenderID, 10, 64); err == nil {
		eventMessage.WriterID = &id
	}

	err := h.Db.Create(eventMessage).Error
	if err != nil {
		log.Printf("ERROR: DATABASE: Failed to save message: %v", err)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "Could not save your message.",
		})
		return
	}

	Broadcast(h, eventMessage, "")
}

func HandleEditEvent(h *Hub, eventMessage *Message) {
	now := time.Now()
	writerID, _ := strconv.ParseInt(eventMessage.SenderID, 10, 64)
	result := h.Db.Model(&Message{}).Where("id = ? AND writer_id = ? AND sent_at > ?",
		eventMessage.Id, writerID, now.Add(-h.Conf.EditLimit)).
		Updates(map[string]any{
			"contents":  eventMessage.Content,
			"edited_at": &now,
		})
	if result.Error != nil {
		log.Printf("ERROR: DATABASE: Edit failed for Message#%05d: %v", eventMessage.Id, result.Error)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "Could not process edit action.",
		})
		return
	}
	if result.RowsAffected == 0 {
		log.Printf("DEBUG: EVENTS: Message %d for user %s not found or time limit has expired.",
			eventMessage.Id, eventMessage.SenderID)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "You don't have permission to edit this message or time limit has expired.",
		})
		return
	}

	eventMessage.IsEdited = true
	eventMessage.EditedAt = &now
	Broadcast(h, eventMessage, "")
}

func HandleDeleteEvent(h *Hub, eventMessage *Message) {
	now := time.Now()
	writerID, _ := strconv.ParseInt(eventMessage.SenderID, 10, 64)
	result := h.Db.Model(&Message{}).Where("id = ? AND writer_id = ? AND deleted_at IS NULL",
		eventMessage.Id, writerID).
		Updates(map[string]any{
			"deleted_at": &now,
		})
	if result.Error == nil && result.RowsAffected > 0 {
		eventMessage.Event = "delete"
		Broadcast(h, eventMessage, "")
	} else {
		log.Printf("ERROR: DATABASE: Delete failed for messageID %d: %v:", eventMessage.Id, result.Error)
		SendError(eventMessage.SenderID, h, Message{
			Event:   "error",
			Content: "Could not process delete action.",
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
	log.Printf("INFO: EVENTS: user { Name: %q, ID: %q } has joined the chat", client.Name, client.ID)

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
	client.SafeClose()
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
