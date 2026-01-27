package service

import (
	"log"
	"net/http"
	"notification-service/model"
)

func DismissSingleNotification(userID string , notifID int, hub *Hub, w http.ResponseWriter) {
	if err := hub.Db.Table("notification_users").
	Where("notification_id = ? AND notified_id = ?", notifID, userID).
	Update("is_dismissed", true).Error; err != nil {
		log.Printf("Error dismissing notification %d for user %s: %v", notifID, userID, err)
		http.Error(w, "internal Server Error", 500)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event: "delete",
		TargetID: userID,
		Payload: map[string]int{"notification_id": notifID},
	}
	w.WriteHeader(http.StatusNoContent)
}

func DismissAllNotifications(userID string, hub *Hub, w http.ResponseWriter) {
	if err := hub.Db.Table("notification_users").
	Where("notified_id = ?", userID).
	Update("is_dismissed", true).Error; err != nil {
		log.Printf("Error dismissing all notifications for user %s: %v", userID, err)
		http.Error(w, "internal Server Error", 500)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event: "delete_all",
		TargetID: userID,
	}
	w.WriteHeader(http.StatusNoContent)	
}