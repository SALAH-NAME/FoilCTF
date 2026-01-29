package service

import (
	"github.com/gorilla/mux"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"kodaic.ma/notification/model"
	"log"
	"net/http"
	"strconv"
)

func GetNonReadRecords(tx *gorm.DB, userID string) ([]model.UserNotification, error) {
	var ids []int
	err := tx.Table("notifications").
		Joins("LEFT JOIN notification_users on notification_users.notification_id = notifications.id AND notification_users.notified_id = ?", userID).
		Where("notification_users.notified_id IS NULL").
		Pluck("notifications.id", &ids).Error

	lenIDs := len(ids)
	if err != nil || lenIDs == 0 {
		return nil, err
	}
	records := make([]model.UserNotification, lenIDs)
	for i, id := range ids {
		records[i] = model.UserNotification{
			NotificationID: id,
			NotifiedID:     userID,
			IsDismissed:    false,
			IsRead:         true,
		}
	}
	return records, nil
}

func (hub *Hub) HandleReadAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	err := hub.Db.Transaction(func(tx *gorm.DB) error {
		newRecords, err := GetNonReadRecords(tx, userID)
		// in case err == nil && newRecords == nil there are no records to insert I return nil
		if err != nil || newRecords == nil {
			return err
		}
		err = tx.Table("notification_users").
			Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
				DoUpdates: clause.Assignments(map[string]interface{}{"is_read": true}),
			}).
			Create(&newRecords).Error

		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		log.Printf("Transaction failed for userId %s while making all notifications as read: %v", userID, err)
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
	err = hub.Db.Table("notification_users").
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "notification_id"}, {Name: "notified_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"is_read": true}),
		}).
		Create(model.UserNotification{
			NotificationID: notifID,
			NotifiedID:     userID,
			IsRead:         true,
		}).Error
	if err != nil {
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
