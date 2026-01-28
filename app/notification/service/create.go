package service

import (
	"encoding/json"
	"log"
	"time"

	"kodaic.ma/notification/model"
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
	notification := model.Notification{
		CreatedAt: time.Now(),
		Contents:  contentJSON,
	}
	result := hub.Db.Table("notifications").Create(&notification)

	if result.Error != nil {
		log.Printf("Error saving notification into database %v", result.Error)
		return result.Error
	}

	hub.GlobalChan <- model.WsEvent{
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
