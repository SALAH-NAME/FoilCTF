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

	if err:= GetTotalCount(&totalCount, hub, w, userID); err != nil {
		return
	}
	if err:= GetUnreadCount(&unreadCount, hub, w, userID); err != nil {
		return
	}
	if err:= GetNotifications(hub, w, userID, &notifications, limit); err != nil {
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

func GetTotalCount(totalCount *int64, hub *Hub, w http.ResponseWriter, userID string) error {
	if err := hub.Db.Table("notifications").
	Where("NOT EXISTS (SELECT notification_id FROM notification_users WHERE notified_id = ? AND notification_users.notification_id = notifications.id AND notification_users.is_dismissed = true)", userID).
	Count(totalCount).Error; err != nil {
		log.Printf("Error counting total notifications: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return err
	}
	return nil
}

func GetUnreadCount(unreadCount *int64, hub *Hub, w http.ResponseWriter, userID string) error{
	if err := hub.Db.Table("notifications").
	Where("NOT EXISTS (SELECT notification_id FROM notification_users WHERE notified_id = ? AND notification_users.notification_id = notifications.id)", userID).
	Count(unreadCount).Error; err != nil {
		log.Printf("Error counting unread notifications: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return err
	}
	return nil
}

func GetNotifications(hub *Hub, w http.ResponseWriter, userID string, notifications *[]model.NotificationResponse, limit int) error {
	if err := hub.Db.Table("notifications").
	Where("NOT EXISTS (SELECT notification_id FROM notification_users WHERE notified_id = ? AND notification_users.notification_id = notifications.id AND notification_users.is_dismissed = true)", userID).
	Select("notifications.*, EXISTS(SELECT 1 FROM notification_users WHERE notified_id = ? AND notifications.id = notification_users.notification_id) AS is_read", userID).
	Order("created_at DESC").
	Limit(limit).
	Scan(notifications).Error; err != nil {
		log.Printf("Error fetching notifications: %v", err)
		http.Error(w, "Inernal Server Error", http.StatusInternalServerError)
		return err
	}
	return nil
}