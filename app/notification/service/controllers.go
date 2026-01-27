package service

import (
	"fmt"
	"log"
	"net/http"
	"notification-service/model"
	"strconv"
	"gorm.io/gorm/clause"
	"github.com/gorilla/mux"
)


func (hub *Hub) ServWs(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	userRole := r.Context().Value("userRole").(string)

	connection, err := hub.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Upgrading http connection failed : %v", err)
		JSONError(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	joinedClient := NewClient(userID, userRole, connection, hub)
	hub.RegisterChan <- joinedClient
	go joinedClient.ReadFromConnectionTunnel()
	go joinedClient.WriteToConnectionTunnel()
}

func (hub *Hub) HandleListNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)
	limit := getLimit(r)
	ListNotifications(userID, limit, hub, w)
}

func (hub *Hub) HandleDeleteAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	if err := hub.Db.Table("notification_users").
		Where("notified_id = ?", userID).
		Update("is_dismissed", true).Error; err != nil {
		log.Printf("Error dismissing all notifications for user %s: %v", userID, err)
		JSONError(w, "internal Server Error", 500)
		return
	}
	hub.GlobalChan <- model.WsEvent{
		Event:    "delete_all",
		TargetID: userID,
	}
	w.WriteHeader(http.StatusNoContent)
}

func (hub *Hub) HandleReadAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(string)

	query := `INSERT INTO notification_users (notification_id, notified_id)
	SELECT id, ? FROM notifications WHERE id NOT IN 
	(SELECT notification_id FROM notification_users WHERE notified_id = ?)`

	if err := hub.Db.Exec(query, userID, userID).Error; err != nil {
		log.Printf("Error while marking all notificationsas read for userId %s: %v", userID, err)
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
		Clauses(clause.OnConflict{DoNothing: true}). //if a user clicked mark as read twice do nothing
		Create(model.UserNotification{
			NotificationID: notifID,
			NotifiedID:     userID,
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
		if err := hub.Db.Table("notification_users").
		Where("notification_id = ? AND notified_id = ?", notifID, userID).
		Update("is_dismissed", true).Error; err != nil {
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

// helper

func getLimit(r *http.Request) int {
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	if limit < 0 {
		limit = 20
	}
	return limit
}
