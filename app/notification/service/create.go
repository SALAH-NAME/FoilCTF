package service

import (
	"encoding/json"
	"log"
	"time"
)

func (hub *Hub) CreateNotification(ntype, title, message, link string) error {
	content := map[string]string{
		"type":    ntype,
		"title":   title,
		"message": message,
		"link":    link,
	}
	contentJSON, err := json.Marshal(content)
	if err != nil {
		log.Printf("Error marshaling data %v", err)
		return err
	}
	notification := Notification{
		CreatedAt: time.Now(),
		Contents:  contentJSON,
	}
	err = hub.Db.Table("notifications").Create(&notification).Error

	if err != nil {
		log.Printf("Error saving notification into database %v", err)
		return err
	}

	hub.GlobalChan <- WsEvent{
		Event: "new",
		Payload: map[string]any{
			"id":         notification.ID,
			"type":       ntype,
			"title":      title,
			"message":    message,
			"link":       link,
			"is_read":    false,
			"created_at": notification.CreatedAt,
		},
	}
	log.Printf("Successfully created notification with ID: %d", notification.ID)
	return nil
}
