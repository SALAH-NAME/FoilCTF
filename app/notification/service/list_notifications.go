package service

import (
	"encoding/json"
	"log"
	"net/http"
	"notification-service/model"
)

func ListNotifications(userID string , limit int, hub *Hub, w http.ResponseWriter) {
	var totalCount, unreadCount int64
	var notifications []model.NotificationResponse

	if err := hub.Db.Table("notifications").Count(&totalCount).Error; err != nil {
		log.Printf("Error counting total notifications: %v", err)
		http.Error(w, "Inernal Server Error", http.StatusInternalServerError)
		return
	}

	if err := hub.Db.Table("notifications").
	Where("id NOT IN (SELECT notification_id FROM notification_users WHERE notified_id = ?)", userID).
	Count(&unreadCount).Error; err != nil {
		log.Printf("Error counting unread notifications: %v", err)
		http.Error(w, "Inernal Server Error", http.StatusInternalServerError)
		return
	}

	if err := hub.Db.Table("notifications").
	Select("notifications.*, EXISTS(SELECT 1 FROM notification_users WHERE notified_id = ? AND notifications.id = notification_users.notification_id) AS is_read", userID).
	Order("created_at DESC").
	Limit(limit).
	Scan(&notifications).Error; err != nil {
		log.Printf("Error fetching notifications: %v", err)
		http.Error(w, "Inernal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]any{
		"notifications" : notifications,
		"total_count": totalCount,
		"unread_count":	unreadCount,
	}); err != nil {
		log.Printf("Error encoding json data: %v", err)
		http.Error(w, "Inernal Server Error", http.StatusInternalServerError)
	}
}