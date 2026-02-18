package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"
)

func (h *Hub) ListAllEvents(w http.ResponseWriter, r *http.Request) {
	userID, userRole, err := GetUserInfo(r)
	if err != nil {
		log.Printf("Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var events []Ctf
	db := h.Db.Model(&Ctf{})
	if userRole != "admin" {
		db = db.Joins("INNER JOIN ctf_organizers ON ctf_organizers.ctf_id = ctfs.id").
			Where("ctf_organizers.organizer_id = ?", *userID)
	}
	db = db.Order("ctfs.start_time DESC")
	err = db.Find(&events).Error
	if err != nil {
		log.Printf("Database Error: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, events, http.StatusOK)
}

func (h *Hub) CreateEvent(w http.ResponseWriter, r *http.Request) {
	userID, _, err := GetUserInfo(r)
	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid input: could not fetch event data for user %d: %v", *userID, err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}
	var newCtf Ctf
	err = h.Db.Transaction(func(tx *gorm.DB) error {
		newCtf = Ctf{
			Name:           req.Name,
			TeamMembersMin: req.TeamMembersMin,
			TeamMembersMax: req.TeamMembersMax,
			MetaData:       req.MetaData,
			StartTime:      req.StartTime,
			EndTime:        req.EndTime,
			MaxTeams:       req.MaxTeams,
			Status:         "draft",
		}
		err := tx.Table("ctfs").Create(&newCtf).Error
		if err != nil {
			return err
		}
		ctfToOrganizer := CtfOrganizers{
			CtfID:       newCtf.ID,
			OrganizerID: *userID,
		}
		err = tx.Table("ctf_organizers").
			Create(&ctfToOrganizer).Error
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		log.Printf("Transatction Failed: Could not create event: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	resp := map[string]any{
		"id": newCtf.ID,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	currentEvent, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid input: could not fetch event data %v", err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}
	updatedEvent := Ctf{
		Name:           req.Name,
		TeamMembersMin: req.TeamMembersMin,
		TeamMembersMax: req.TeamMembersMax,
		MetaData:       req.MetaData,
		EndTime:        req.EndTime,
		MaxTeams:       req.MaxTeams,
	}
	if currentEvent.Status == "draft" {
		updatedEvent.StartTime = req.StartTime
	}
	err := h.Db.Table("ctfs").
		Where("id = ?", currentEvent.ID).
		Updates(updatedEvent).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Update failed", http.StatusInternalServerError)
		return
	}
	var resp Ctf
	err = h.Db.Table("ctfs").
		Where("id = ?", currentEvent.ID).
		First(&resp).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, resp, http.StatusOK)
}

func (h *Hub) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusInternalServerError)
		return
	}
	if event.Status == "active" {
		log.Printf("Cannot delete a live event, eventID: %d", event.ID)
		JSONError(w, "Cannot delete a live event", http.StatusConflict)
		return
	}
	err := h.Db.Delete(&event).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, nil, http.StatusNoContent)
}

func (h *Hub) LinkChallenge(w http.ResponseWriter, r *http.Request) {
	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	var req []CtfsChallenge
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("Invalid input: could not fetch event data for user %d: %v", *userID, err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}
	var exists bool
	for _, challenge := range req {
		if challenge.CtfID != event.ID {
			log.Printf("User %d tried to link challeges to eventID %d on wrong endpoint", *userID, challenge.CtfID)
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}
		err = h.Db.Table("challenges").
			Select("count(*) > 0").
			Where("id = ? AND is_published = ?", challenge.ChallengeID, true).
			Find(&exists).Error
		if err != nil || !exists {
			log.Printf("Link Failure: challenge %d not found or not published. user: %d: %v", challenge.ChallengeID, *userID, err)
			JSONError(w, "Challenge not found or not published", http.StatusBadRequest)
			return
		}
	}
	h.Db.Transaction(func(tx *gorm.DB) error {
		for _, challenge := range req {
			err = tx.Table("ctfs_challenges").
				Create(&challenge).Error
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("Could not link challengesfor user: %d: %v", *userID, err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	ids := make([]int, len(req))
	for i, c := range req {
		ids[i] = c.ChallengeID
	}
	resp := map[string]any{
		"linked ids": ids,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) UnlinkChallenge(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	challID, err := h.ReadIntParam(r, "chall_id")
	if err != nil {
		log.Printf("Invalid challengeID: %v", err)
		JSONError(w, "Invalid challengeID", http.StatusBadRequest)
		return
	}
	result := h.Db.Table("ctfs_challenges").
		Where("ctf_id = ? AND challenge_id = ?", event.ID, challID).
		Delete(nil)
	if result.Error != nil {
		log.Printf("Database Error: %v", result.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		log.Printf("Link not found")
		JSONError(w, "Link not found", http.StatusNotFound)
		return
	}
	JSONResponse(w, nil, http.StatusCreated)
}

func (h *Hub) StartEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	if event.Status == "active" {
		JSONResponse(w, "event already active", http.StatusConflict)
		return
	}
	var roomInstance ChatRoom
	err := h.Db.Transaction(func(tx *gorm.DB) error {
		var count int64
		err := tx.Table("ctfs_challenges").
			Where("ctf_id = ?", event.ID).
			Count(&count).Error
		if err != nil {
			return err
		}
		if count == 0 {
			return errors.New("no linked challenge found")
		}
		now := time.Now()
		updatedEvent := map[string]any{
			"status":     "active",
			"start_time": now,
		}
		err = tx.Model(&event).
			Select("status", "start_time").
			Updates(updatedEvent).Error
		if err != nil {
			return err
		}
		roomInstance = ChatRoom{
			CtfID:     event.ID,
			Room_Type: "global",
		}
		return tx.Table("chat_rooms").
			Create(&roomInstance).Error
	})
	if err != nil {
		if err.Error() == "no linked challenge found" {
			log.Printf("Cannot start event %d without challenges", event.ID)
			JSONError(w, "Cannot start event %d without challenges", http.StatusConflict)
		} else {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}	
	msg := fmt.Sprintf("Event %s has officially started! Good luck", event.Name)
	errNotif := h.Notify("Event active !", msg, event.ID)
	if errNotif != nil {
		log.Printf("Failed to send start notification")
	}
	resp := map[string]any {
		"event_id": event.ID,
		"ctf_chat_room": roomInstance.ID,
	}	
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) StopEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	if event.Status != "ended" {
		now := time.Now()
		updatedEvent := map[string]any{
			"status":   "ended",
			"end_time": now,
		}
		err := h.Db.Model(&event).
			Select("status", "end_time").
			Updates(updatedEvent).Error
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		JSONResponse(w, nil, http.StatusCreated)
		return
	}
	JSONResponse(w, "event already ended", http.StatusConflict)
}
