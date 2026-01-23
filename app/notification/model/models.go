package model

import (
	"encoding/json"
	"time"
)

type NotificationResponse struct {
	ID			uint 			`json:"notification_id" gorm:"primaryKey"`
	IsRead		bool			`json:"is_read"`
	CreatedAt	time.Time		`json:"created_at" gorm:"default:now()"`
	Content		json.RawMessage	`json:"content" gorm:"type:json"`
}

// type Notification struct {
// 	ID				uint 		`json:"notification_id"`
// 	Type			string		`json:"type"`
// 	Title 			string		`json:"title"`
// 	Message 		string		`json:"message"`
// 	Link			string		`json:"link,omitempty"`
// }

type UserNotification struct {
	NotificationID	int 	`gorm:"primaryKey"`
	NotifiedID		string	`gorm:"primaryKey"`

}

type WsEvent struct {
	Event 		string 			`json:"type"`
	TargetID		string			`json:"target_id"`
	Payload		interface{}			`json:"metadata"`
}

