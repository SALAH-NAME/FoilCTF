package model

import (
	"encoding/json"
	"time"
)


type NotificationResponse struct {
	ID			uint 			`json:"notification_id" gorm:"primaryKey"`
	IsRead		bool			`json:"is_read"`
	CreatedAt	time.Time		`json:"created_at" gorm:"default:now()"`
	Contents		json.RawMessage	`json:"contents" gorm:"type:json"`
}


type UserNotification struct {
	NotificationID	int 	`gorm:"primaryKey"`
	NotifiedID		string	`gorm:"primaryKey"`
	IsDismissed		bool	`gorm:"column:is_dismissed"`
}

type WsEvent struct {
	Event 		string 			`json:"event"`
	TargetID		string			`json:"target_id"`
	Payload		interface{}			`json:"metadata"`
}

type Notification struct {
	ID			uint 			`json:"id" gorm:"primaryKey"`
	CreatedAt	time.Time		`json:"created_at" gorm:"default:now()"`
	Contents		json.RawMessage	`json:"contents" gorm:"type:json"`
}