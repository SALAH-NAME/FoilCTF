package service

import (
	"log"
	"net/http"
	"notification-service/model"
	"gorm.io/gorm/clause"
)

func MarkSingleNotification(userID string , notifID int, hub *Hub, w http.ResponseWriter) {
	if err := hub.Db.Table("notification_users").
	Clauses(clause.OnConflict{DoNothing: true}). //if a user clicked mark as read twice do nothing
	Create(model.UserNotification{
		NotificationID: notifID,
		NotifiedID: userID,
	}).Error ; err != nil {
		log.Printf("Error while marking notification %d as read for userId %s: %v",notifID, userID, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event: "read",
		TargetID: userID,
		Payload: map[string]int{"notification_id": notifID},
	}
	w.WriteHeader(http.StatusNoContent)
}

func MarkAllNotification(userID string ,hub *Hub, w http.ResponseWriter) {
	query := `INSERT INTO notification_users (notification_id, notified_id)
	SELECT id, ? FROM notifications WHERE id NOT IN 
	(SELECT notification_id FROM notification_users WHERE notified_id = ?)`

	if err := hub.Db.Exec(query, userID, userID).Error; err != nil {
		log.Printf("Error while marking all notificationsas read for userId %s: %v", userID, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event: "read_all",
		TargetID: userID,
	}
	w.WriteHeader(http.StatusNoContent)
}