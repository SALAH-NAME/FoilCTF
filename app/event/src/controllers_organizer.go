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
		log.Printf("DEBUG - HTTP - Unauthorized: %v", err)
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
		log.Printf("ERROR - DATABASE - Could not query all events: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	JSONResponse(w, events, http.StatusOK)
}

func (h *Hub) CreateEvent(w http.ResponseWriter, r *http.Request) {
	userID, _, err := GetUserInfo(r)
	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR - HTTP - Invalid request format: %v", err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}

	newCtf := Ctf{
		Name:           req.Name,
		TeamMembersMin: req.TeamMembersMin,
		TeamMembersMax: req.TeamMembersMax,
		MetaData:       req.MetaData,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		MaxTeams:       req.MaxTeams,
		Status:         "draft",
	}
	err = h.Db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("ctfs").Create(&newCtf).Error; err != nil {
			return err
		}

		ctfToOrganizer := CtfOrganizers{
			CtfID:       newCtf.ID,
			OrganizerID: *userID,
		}
		return tx.Table("ctf_organizers").Create(&ctfToOrganizer).Error
	})
	if err != nil {
		log.Printf("ERROR - DATABASE - Could not commit transaction due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	resp := map[string]any{"id": newCtf.ID}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	currentEvent, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "Event not found", http.StatusNotFound)
		return
	}

	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR - HTTP - Invalid request format: %v", err)
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
		log.Printf("ERROR - DATABASE - Could not update ctfs table due to: %v", err)
		JSONError(w, "Update failed", http.StatusInternalServerError)
		return
	}

	var resp Ctf
	err = h.Db.Table("ctfs").
		Where("id = ?", currentEvent.ID).
		First(&resp).Error
	if err != nil {
		log.Printf("ERROR - DATABASE - Could not query updated ctf due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, resp, http.StatusOK)
}

func (h *Hub) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusInternalServerError)
		return
	}
	if event.Status == "active" {
		log.Printf("ERROR - Delete Event - Cannot delete an event %d while it's active", event.ID)
		JSONError(w, "Cannot delete a live event", http.StatusConflict)
		return
	}

	if err := h.Db.Delete(&event).Error; err != nil {
		log.Printf("ERROR - DATABASE - Could not delete event %d due to: %v", event.ID, err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, nil, http.StatusNoContent)
}

func (h *Hub) LinkChallenge(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "Event not found", http.StatusNotFound)
		return
	}

	var req []CtfsChallenge
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR - HTTP - Invalid request format: %v", err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}

	for _, challenge := range req {
		if challenge.CtfID != event.ID {
			log.Printf("ERROR - HTTP - Challenge event id %d did not match endpoint event id %d", challenge.CtfID, event.ID)
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}

		var exists bool
		err := h.Db.Table("challenges").Select("count(*) > 0").
			Where("id = ? AND is_published = true", challenge.ChallengeID).Find(&exists).Error
		if err != nil {
			log.Printf("ERROR - DATABASE - Could not check whether challenge exists or not: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if !exists {
			log.Printf("ERROR - DATABASE - Requested linking operation on non-existent challenge %d", challenge.ChallengeID)
			JSONError(w, fmt.Sprintf("Challenge %d Not Found", challenge.ChallengeID), http.StatusNotFound)
			return
		}
	}

	err := h.Db.Transaction(func(tx *gorm.DB) error {
		for _, challenge := range req {
			if res := tx.Table("ctfs_challenges").Create(&challenge); res.Error != nil {
				return res.Error
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("ERROR - DATABASE - Could not commit transaction linking challenges due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	ids := make([]int, len(req))
	for i, c := range req {
		ids[i] = c.ChallengeID
	}

	resp := map[string]any{
		"challenge_ids": ids,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) UnlinkChallenge(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "Event not found", http.StatusNotFound)
		return
	}

	challID, err := h.ReadIntParam(r, "chall_id")
	if err != nil {
		log.Printf("ERROR - HTTP - Invalid request path format of 'chall_id': %v", err)
		JSONError(w, "Invalid challengeID", http.StatusBadRequest)
		return
	}

	result := h.Db.Table("ctfs_challenges").
		Where("ctf_id = ? AND challenge_id = ?", event.ID, challID).
		Delete(nil)
	if result.Error != nil {
		log.Printf("ERROR - DATABASE - Could not unlink challenge due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected == 0 {
		log.Printf("ERROR - DATABASE - Could not unlink challenge due to: link does not exist")
		JSONError(w, "Link not found", http.StatusNotFound)
		return
	}

	JSONResponse(w, nil, http.StatusCreated)
}

func (h *Hub) StartEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	if event.Status == "active" {
		JSONResponse(w, "event already active", http.StatusConflict)
		return
	}

	ErrMissingLinkedChallenge := errors.New("no linked challenge found")

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
			return ErrMissingLinkedChallenge
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
		return tx.Table("chat_rooms").Create(&roomInstance).Error
	})
	if err != nil {
		if errors.Is(err, ErrMissingLinkedChallenge) {
			log.Printf("ERROR - DATABASE - Cannot start event %d without challenges", event.ID)
			JSONError(w, "Event has no challenges", http.StatusConflict)
		} else {
			log.Printf("ERROR - DATABASE - Could not commit transaction due to: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	msg := fmt.Sprintf("Event %s has officially started! Good luck", event.Name)
	errNotif := h.Notify("Event Started", msg, event.ID)
	if errNotif != nil {
		log.Printf("Failed to send start notification")
	}

	resp := map[string]any{
		"event_id":      event.ID,
		"ctf_chat_room": roomInstance.ID,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) StopEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get event from the request context")
		JSONError(w, "Event not found", http.StatusNotFound)
		return
	}
	if event.Status == "ended" {
		JSONResponse(w, "Event has already stopped", http.StatusConflict)
		return
	}

	now := time.Now()
	updatedEvent := map[string]any{
		"status":   "ended",
		"end_time": now,
	}

	err := h.Db.Model(&event).
		Select("status", "end_time").
		Updates(updatedEvent).Error
	if err != nil {
		log.Printf("ERROR - DATABASE - Could not update event status due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	JSONResponse(w, nil, http.StatusCreated)
}
