package service

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"gorm.io/gorm/clause"
	"kodaic.ma/notification/model"
)

func (hub *Hub) HandleReadAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	var unreadIDS []int

	// find all notinication IDs that this user has not read
	result := hub.Db.Table("notifications").
		Joins("LEFT JOIN notification_users on notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("notification_users.notified_id IS NULL").
		Pluck("notifications.id", &unreadIDS)

	if result.Error != nil {
		log.Printf("Error fetching unread IDs for %s: %v", userID, result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	lenIDs := len(unreadIDS)
	if lenIDs == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	// prepare the records for bulk insertion
	newRecords := make([]model.UserNotification, lenIDs)
	for i, id := range unreadIDS {
		newRecords[i] = model.UserNotification{
			NotificationID: id,
			NotifiedID:     userID,
			IsDismissed:    false,
			IsRead:         true,
		}
	}
	// create in one go
	result = hub.Db.Table("notification_users").
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"is_read": true}),
		}).
		Create(&newRecords)

	if result.Error != nil {
		log.Printf("Error marking all notificationsas read for userId %s: %v", userID, result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	hub.GlobalChan <- model.WsEvent{
		Event:    "read_all",
		TargetID: userID,
	}
	w.WriteHeader(http.StatusNoContent)
}

func (hub *Hub) HandleReadSingle(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	vars := mux.Vars(r)
	idStr := vars["id"]
	notifID, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("A valid notificationID required: %v", err)
		JSONError(w, "A valid notificationID required", http.StatusBadRequest)
		return
	}
	if err := hub.Db.Table("notification_users").
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"is_read": true}),
		}).
		Create(model.UserNotification{
			NotificationID: notifID,
			NotifiedID:     userID,
			IsRead:         true,
		}).Error; err != nil {
		log.Printf("Error while marking notification %d as read for userId %s: %v", notifID, userID, err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event:    "read",
		TargetID: userID,
		Payload:  map[string]int{"notification_id": notifID},
	}
	w.WriteHeader(http.StatusNoContent)
}
