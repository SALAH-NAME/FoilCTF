package service

import (
	"encoding/json"
	"time"
)

type NotificationResponse struct {
	ID        int             `json:"notification_id" gorm:"primaryKey"`
	IsRead    bool            `json:"is_read"`
	CreatedAt time.Time       `json:"created_at" gorm:"default:now()"`
	Contents  json.RawMessage `json:"contents" gorm:"type:json"`
}

type UserNotification struct {
	NotificationID int        `json:"notification_id" gorm:"column:notification_id;primaryKey"`
	NotifiedID     int        `json:"user_id" gorm:"column:user_id;primaryKey"`
	IsDismissed    bool       `json:"is_dismissed" gorm:"column:is_dismissed"`
	IsRead         bool       `json:"is_read" gorm:"column:is_read"`
	ReadAt         *time.Time `json:"read_at" gorm:"column:read_at"`
}

type WsEvent struct {
	Event    string      `json:"event"`
	TargetID int         `json:"target_id"`
	Payload  interface{} `json:"metadata"`
}

type Notification struct {
	ID        int             `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time       `json:"created_at" gorm:"default:now()"`
	Contents  json.RawMessage `json:"contents" gorm:"type:json"`
}
