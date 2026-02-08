package main

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
	NotificationID int    `gorm:"column:notification_id;primaryKey"`
	NotifiedID     string `gorm:"column:notified_id;primaryKey"`
	IsDismissed    bool   `gorm:"column:is_dismissed"`
	IsRead         bool   `gorm:"column:is_read"`
}

type WsEvent struct {
	Event    string      `json:"event"`
	TargetID string      `json:"target_id"`
	Payload  interface{} `json:"metadata"`
}

type Notification struct {
	ID        int             `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time       `json:"created_at" gorm:"default:now()"`
	Contents  json.RawMessage `json:"contents" gorm:"type:json"`
}
