package service

import (
	"encoding/json"
	"kodaic.ma/notification/model"
	"log"
	"net/http"
	"strconv"
)

func (hub *Hub) HandleListNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	limit := getLimit(r)
	ListNotifications(userID, limit, hub, w)
}

func ListNotifications(userID string, limit int, hub *Hub, w http.ResponseWriter) {
	var totalCount, unreadCount int64
	notifications := []model.NotificationResponse{}

	if err := GetTotalCount(&totalCount, hub, w, userID); err != nil {
		return
	}
	if err := GetUnreadCount(&unreadCount, hub, w, userID); err != nil {
		return
	}
	if err := GetNotifications(hub, w, userID, &notifications, limit); err != nil {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]any{
		"notifications": notifications,
		"total_count":   totalCount,
		"unread_count":  unreadCount,
	}); err != nil {
		log.Printf("Error encoding json data: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func GetTotalCount(totalCount *int64, hub *Hub, w http.ResponseWriter, userID string) error {

	result := hub.Db.Table("notifications").
		Joins("LEFT JOIN notification_users ON notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("notification_users.is_dismissed IS NULL OR notification_users.is_dismissed = ?", false).
		Count(totalCount)

	if result.Error != nil {
		log.Printf("Error counting total notifications: %v", result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return result.Error
	}
	return nil
}

func GetUnreadCount(unreadCount *int64, hub *Hub, w http.ResponseWriter, userID string) error {

	result := hub.Db.Table("notifications").
		Joins("LEFT JOIN notification_users ON notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("(notification_users.notified_id IS NULL OR notification_users.is_read = ?)", false).
		Where("(notification_users.is_dismissed IS NULL or notification_users.is_dismissed = ?)", false).
		Count(unreadCount)

	if result.Error != nil {
		log.Printf("Error counting unread notifications: %v", result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return result.Error
	}
	return nil
}

func GetNotifications(hub *Hub, w http.ResponseWriter, userID string, notifications *[]model.NotificationResponse, limit int) error {
	result := hub.Db.Table("notifications").
		Joins("LEFT JOIN notification_users ON notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("notification_users.is_dismissed IS NULL OR notification_users.is_dismissed = ?", false).
		Select("notifications.*, COALESCE(notification_users.is_read, false) AS is_read").
		Order("notifications.created_at DESC").
		Limit(limit).
		Scan(notifications)
	if result.Error != nil {
		log.Printf("Error fetching notifications: %v", result.Error)
		JSONError(w, "Inernal Server Error", http.StatusInternalServerError)
		return result.Error
	}
	return nil
}

// helper

func getLimit(r *http.Request) int {
	limilStr := r.URL.Query().Get("limit")
	if limilStr == "" {
		return 20
	}
	val, err := strconv.ParseInt(limilStr, 10, 64)
	if err != nil {
		return 20
	}
	limit := int(val)
	if limit < 0 {
		limit = 20
	}
	if limit > 100 {
		return 100
	}
	return limit
}
