package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (h *Hub) SubmitFlag(w http.ResponseWriter, r *http.Request) {
	ctfID, _ := h.ReadIntParam(r, "id") // err already checked
	challengeId, err := h.ReadIntParam(r, "chall_id")
	if err != nil {
		log.Printf("Invalid challengeID: %v", err)
		JSONError(w, "Invalid challengeID", http.StatusBadRequest)
		return
	}
	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req FlagRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid request : %v", err)
		JSONError(w, "Invalid request", http.StatusBadRequest)
		return
	}
	teamID, err := h.GetTeamIDByUserID(userID)
	if err != nil {
		log.Printf("could not get teamID %v", err)
		JSONError(w, "team not found", http.StatusNotFound)
		return
	}
	var isFirtsBlood bool
	var finalPoints int
	err = h.Db.Transaction(func(tx *gorm.DB) error {
		var link CtfChallengeLink
		err = tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("ctf_id = ? AND challenge_id = ?", ctfID, challengeId).
			First(&link).Error
		if err != nil {
			return err
		}
		var challenge Challenge
		err = tx.First(&challenge, challengeId).Error
		if err != nil {
			return err
		}
		if tx.Table("solves").
			Where("ctf_id = ? AND chall_id = ? AND team_id = ?", ctfID, challengeId, teamID).
			Find(&Solve{}).RowsAffected > 0 {
			return errors.New("already solved")
		}
		now := time.Now()
		err = tx.Model(&link).
			Update("attempts", gorm.Expr("attempts + 1")).Error
		if err != nil {
			return err
		}
		err = tx.Table("participations").
			Where("ctf_id = ? AND team_id = ?", ctfID, teamID).
			Update("last_attempt_at", now).Error
		if err != nil {
			return err
		}
		if !h.VerifyFlag(link.Flag, req.Flag) {
			return errors.New("incorrect flag")
		}
		link.Solves++
		finalPoints = link.Reward
		if link.FirstBloodAt == nil {
			isFirtsBlood = true
			finalPoints += challenge.RewardFirstBlood
			now := time.Now()
			link.FirstBloodAt = &now
			link.FirstbloodId = &teamID
		}
		err = tx.Model(&link).
			Select("solves", "first_blood_at", "first_blood_id").
			Updates(&link).Error
		if err != nil {
			return err
		}
		updatedSolve := Solve{
			CtfID:       ctfID,
			ChallengeID: challengeId,
			TeamID:      teamID,
			Score:       finalPoints,
			CreatedAt:   time.Now(),
		}
		err = tx.Table("solves").Create(&updatedSolve).Error
		if err != nil {
			return err
		}
		err = tx.Table("participations").
			Where("ctf_id = ? AND team_id = ?", ctfID, teamID).
			Update("score", gorm.Expr("score + ?", finalPoints)).Error
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		HandleSubmitError(w, err)
	}
	resp := map[string]any{
		"status":        "correct",
		"first_blood":   isFirtsBlood,
		"points_earned": finalPoints,
	}
	JSONResponse(w, resp, http.StatusOK)
}

func (h *Hub) JoinEvent(w http.ResponseWriter, r *http.Request) {
	ctfID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	event := Ctf{}
	teamID, err := h.GetTeamIDByUserID(userID)
	if err != nil {
		log.Printf("Database Error: %v", err)
		JSONError(w, "Team membership required", http.StatusForbidden)
		return
	}
	err = h.Db.Transaction(func(tx *gorm.DB) error {

		err = tx.First(&event, ctfID).Error
		if err != nil {
			return errors.New("event not found")
		}
		var team Team
		err = tx.First(&team, teamID).Error
		if err != nil {
			return errors.New("team not found")
		}
		var currentPanticipants int64
		err := tx.Table("participations").Where("ctf_id = ?", ctfID).
			Count(&currentPanticipants).Error
		if err != nil {
			return err
		}
		if event.MaxTeams <= int(currentPanticipants) {
			return errors.New("event is full")
		}
		if team.TeamSize < event.TeamMembersMin || team.TeamSize > event.TeamMembersMax {
			return errors.New("invalid team size")
		}
		participation := Participation{
			TeamID:   teamID,
			CtfID:    ctfID,
			Score:    0,
			JoinedAT: time.Now(),
		}
		err = tx.Table("participations").
			Create(&participation).Error
		if err != nil {
			return errors.New("already registated")
		}
		return nil
	})
	if err != nil {
		HandleJoinError(w, err)
		return
	}
	resp := map[string]any{
		"event":      event,
		"registered": true,
		"team_id":    teamID,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) ListCtfChallenges(w http.ResponseWriter, r *http.Request) {
	ctfID, err := h.ReadIntParam(r, "id")
	if err != nil {
		log.Printf("Invalid eventID: %v", err)
		JSONError(w, "Invalid eventID", http.StatusBadRequest)
		return
	}
	challenges := []PlayerChallengeView{}
	err = h.Db.Table("ctf_challenges").
		Select("ctf_challengeh.challenge_id AS id, challengeh.name, challengeh.description, challengeh.category, ctfs_challengeh.reward, ctfs_challengeh.solves").
		Joins("INNER JOIN challenges on ctfs_challengeh.challenge_id = challengeh.id").
		Where("ctf_challengeh.id = ?", ctfID).
		Scan(&challenges).Error
	if err != nil {
		log.Printf("Database Error: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, challenges, http.StatusOK)
}

func (h *Hub) RequestSandbox(w http.ResponseWriter, r *http.Request) {

}

func (h *Hub) KillSandbox(w http.ResponseWriter, r *http.Request) {

}

func (h *Hub) GetScoreboardPlayer(w http.ResponseWriter, r *http.Request) {

}
