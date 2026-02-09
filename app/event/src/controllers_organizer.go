package main

import (
	"encoding/json"
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
		db = db.Joins("INNER JOIN ctf_organizers ON ctf_organizerh.ctf_id = ctfh.id").
			Where("ctf_organizerh.organizer_id = ?", userID)
	}
	db = db.Order("ctfh.start_time DESC")
	err = db.Find(&events).Error
	if err != nil {
		log.Printf("Database Error: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, events, http.StatusOK)
}

func (h *Hub) CreateEvent(w http.ResponseWriter, r *http.Request) {
	userID, _, _ := GetUserInfo(r)
	var req EventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid input: could not fetch event data for user %s: %v", userID, err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}
	var newCtf Ctf
	err := h.Db.Transaction(func(tx *gorm.DB) error {
		newCtf = Ctf{
			Name:           req.Name,
			TeamMembersMin: req.TeamMembersMin,
			TeamMembersMax: req.TeamMembersMax,
			MetaData:       req.MetaData,
			StartTime:      req.StartTime,
			EndTime:        req.EndTime,
			Status:         "draft",
		}
		err := tx.Table("ctfs").Create(&newCtf).Error
		if err != nil {
			return err
		}
		ctfToOrganizer := CtfOrganizers{
			CtfID:       newCtf.ID,
			OrganizerID: userID,
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

}

func (h *Hub) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	eventID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	var event Ctf
	err = h.Db.First(&event, eventID).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Internal Server error", http.StatusInternalServerError)
		return
	}
	if event.Status == "active" {
		log.Printf("Cannot delete a live event, eventID: %d", eventID)
		JSONError(w, "Cannot delete a live event", http.StatusConflict)
		return
	}
	// Soft delete
	err = h.Db.Delete(&event).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Database Error", http.StatusInternalServerError)
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
	var req CtfChallengeLink
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid input: could not fetch event data for user %s: %v", userID, err)
		JSONError(w, "Invalid Input", http.StatusBadRequest)
		return
	}
	var exists bool
	err = h.Db.Table("challenges").
		Select("count(*) > 0").
		Where("id = ? AND is_published = ?", req.ChallengeID, true).
		Find(&exists).Error
	if err != nil {
		log.Printf("Link Failure: challenge %d not found or not published. user: %s: %v", req.ChallengeID, userID, err)
		JSONError(w, "Challenge not found or not published", http.StatusBadRequest)
		return
	}
	err = h.Db.Table("ctfs_challenges").
		Create(&req).Error
	if err != nil {
		log.Printf("Could not link challenge %d for user: %s: %v", req.ChallengeID, userID, err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, nil, http.StatusCreated)
}

func (h *Hub) UnlinkChallenge(w http.ResponseWriter, r *http.Request) {
	eventID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	challID, err := h.ReadIntParam(r, "chall_id")
	if err != nil {
		log.Printf("Invalid challengeID: %v", err)
		JSONError(w, "Invalid challengeID", http.StatusBadRequest)
		return
	}
	result := h.Db.Table("ctfs_challenges").
		Where("ctf_id = ? AND challenge_id = ?", eventID, challID).
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
	eventID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	var event Ctf
	err = h.Db.First(&event, eventID).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Internal Server error", http.StatusInternalServerError)
		return
	}
	if event.Status != "active" {
		var count int64
		err = h.Db.Table("ctf_challenges").
			Where("ctf_id = ?", eventID).
			Count(&count).Error
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if count == 0 {
			log.Printf("Cannot start witout challenges")
			JSONError(w, "Cannot start witout challenges", http.StatusConflict)
		}
		now := time.Now()
		updatedEvent := map[string]any{
			"status":     "active",
			"start_time": now,
		}
		err = h.Db.Model(&event).
			Select("status", "start_time").
			Updates(updatedEvent).Error
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		JSONResponse(w, nil, http.StatusCreated)
	}
	JSONResponse(w, "event already active", http.StatusConflict)

}

func (h *Hub) StopEvent(w http.ResponseWriter, r *http.Request) {
	eventID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	var event Ctf
	err = h.Db.First(&event, eventID).Error
	if err != nil {
		log.Printf("Database error :%v", err)
		JSONError(w, "Internal Server error", http.StatusInternalServerError)
		return
	}
	if event.Status != "ended" {
		now := time.Now()
		updatedEvent := map[string]any{
			"status":   "ended",
			"end_time": now,
		}
		err = h.Db.Model(&event).
			Select("status", "end_time").
			Updates(updatedEvent).Error
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		JSONResponse(w, nil, http.StatusCreated)
	}
	JSONResponse(w, "event already ended", http.StatusConflict)
}
