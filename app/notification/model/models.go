package model

import (
	"encoding/json"
	"time"
)

type Notification struct {
	ID			uint 			`gorm:"primaryKey"`
	Content		json.RawMessage	`gorm:"type:json"`
	CreatedAt	time.Time		`gorm:"default:now()"`
}

type UserNotification struct {
	NotificationID	uint 	`gorm:"primaryKey"`
	NotifiedID		string	`gorm:"primaryKey"`

}

type NotificationResponse struct {
	Type 		string 			`json:"type"`
	Payload		interface{}		`json:"metadata"`
}

type NotificationMetadata struct {
	ID				uint 		`json:"notification_id"`
	IsRead			bool		`json:"is_read"`
	CreatedAt		time.Time	`json:"created_at"`
	Type			string		`json:"type"`
	Title 			string		`json:"title"`
	Message 		string		`json:"message"`
	Link			string		`json:"link,omitempty"`
}
