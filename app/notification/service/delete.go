package service

import (
	"github.com/gorilla/mux"
	"gorm.io/gorm/clause"
	"kodaic.ma/notification/model"
	"log"
	"net/http"
	"strconv"
)

func (hub *Hub) HandleDeleteAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	var nonDeletedIDs []int

	// find all notinication IDs that this user has not deleted
	result := hub.Db.Table("notifications").
		Joins("LEFT JOIN notification_users on notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("notification_users.notified_id IS NULL OR notification_users.is_dismissed = ? ", false).
		Pluck("notifications.id", &nonDeletedIDs)

	if result.Error != nil {
		log.Printf("Error fetching non deleted IDs for %s: %v", userID, result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	lenIDs := len(nonDeletedIDs)
	if lenIDs == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	// prepare the records for bulk insertion
	newRecords := make([]model.UserNotification, lenIDs)
	for i, id := range nonDeletedIDs {
		newRecords[i] = model.UserNotification{
			NotificationID: id,
			NotifiedID:     userID,
			IsDismissed:    true,
			IsRead:         true,
		}
	}

	result = hub.Db.Table("notification_users").
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"is_dismissed": true,
				"is_read":      true,
			}),
		}).
		Create(&newRecords)

	if result.Error != nil {
		log.Printf("Error dismissing all notifications for user %s: %v", userID, result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	hub.GlobalChan <- model.WsEvent{
		Event:    "delete_all",
		TargetID: userID,
	}
	w.WriteHeader(http.StatusNoContent)
}

func (hub *Hub) HandleDeleteSingle(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	vars := mux.Vars(r)
	idStr := vars["id"]
	notifID, err := strconv.Atoi(idStr)
	if err != nil {
		log.Printf("A valid notificationID required: %v", err)
		JSONError(w, "A valid notificationID required", http.StatusBadRequest)
		return
	}
	result := hub.Db.Table("notification_users").
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"is_dismissed": true,
				"is_read":      true,
			}),
		}).
		Create(&model.UserNotification{
			NotificationID: notifID,
			NotifiedID:     userID,
			IsRead:         true,
			IsDismissed:    true,
		})

	if result.Error != nil {
		log.Printf("Error dismissing notification %d for user %s: %v", notifID, userID, err)
		JSONError(w, "internal Server Error", 500)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event:    "delete",
		TargetID: userID,
		Payload:  map[string]int{"notification_id": notifID},
	}
	w.WriteHeader(http.StatusNoContent)
}
