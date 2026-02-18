package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func GetUserInfo(r *http.Request) (*int, string, error) {
	userID, okID := r.Context().Value(userIDKey).(*int)
	userRole, okRole := r.Context().Value(userRoleKey).(string)
	if !okID || !okRole || userID == nil || userRole == "" {
		return nil, "", fmt.Errorf("User identity missing from the context")
	}
	return userID, userRole, nil
}

func JSONError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	resp := map[string]any{
		"status":  "error",
		"code":    code,
		"message": message,
	}
	json.NewEncoder(w).Encode(resp)
}

func JSONResponse(w http.ResponseWriter, data any, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func (h *Hub) ReadIntParam(r *http.Request, param string) (int, error) {
	val := chi.URLParam(r, param)
	return strconv.Atoi(val)
}

func HandleJoinError(w http.ResponseWriter, err error) {
	log.Printf("ERROR - Join: %v", err)

	errorMap := map[string]int{
		"event not found":         http.StatusNotFound,
		"team not found":          http.StatusNotFound,
		"event is full":           http.StatusForbidden,
		"invalid team size":       http.StatusPreconditionFailed,
		"already registered":      http.StatusConflict,
		"ctf chat room not found": http.StatusNotFound,
	}
	if code, exists := errorMap[err.Error()]; exists {
		JSONError(w, err.Error(), code)
		return
	}

	JSONError(w, "Internal Server error", http.StatusInternalServerError)
}

func (h *Hub) GetTeamIDByUserID(userID int) (int, error) {
	var teamID int
	result := h.Db.Table("team_members").
		Where("member_id = ?", userID).
		Pluck("team_id", &teamID)
	if result.Error != nil {
		return 0, result.Error
	}
	if result.RowsAffected == 0 {
		return 0, errors.New("record not found, user is not in a team")
	}
	return teamID, nil
}

func (h *Hub) VerifyFlag(correctFlag map[string]any, submittedFlag string) bool {

	flagType, _ := correctFlag["type"].(string)
	flagContent, _ := correctFlag["content"].(string)
	switch flagType {
	case "static":
		return flagContent == submittedFlag
	default:
		return flagContent == submittedFlag
	}
}

func HandleSubmitError(w http.ResponseWriter, err error) {
	log.Printf("ERROR - Flag Submission: %v", err)

	errorMap := map[string]int{
		"already solved": http.StatusConflict,
		"incorrect flag": http.StatusBadRequest,
	}
	code, exists := errorMap[err.Error()]
	if !exists {
		JSONError(w, "Internal Server error", http.StatusInternalServerError)
		return
	}

	JSONError(w, err.Error(), code)
}

func (h *Hub) Notify(title, message string, eventID int) error {
	content := map[string]string{
		"title":   title,
		"message": message,
	}
	contentJSON, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notification := Notification{
		CreatedAt: time.Now(),
		Contents:  contentJSON,
	}
	return h.Db.Transaction(func(tx *gorm.DB) error {
		var userIDs []int
		err = tx.Table("participations").
			Select("DISTINCT team_members.member_id").
			Joins("team_members ON participations.team_id = team_members.team_id").
			Where("participations.ctf_id = ?", eventID).
			Pluck("team_members.member_id", &userIDs).Error
		if err != nil {
			return err
		}
		if len(userIDs) == 0 {
			return nil
		}
		err := tx.Table("notifications").Create(&notification).Error
		if err != nil {
			return err
		}
		var nortificationUsers []NotificationUsers
		for _, uid := range userIDs {
			nortificationUsers = append(nortificationUsers, NotificationUsers{
				NotificationID: notification.ID,
				UserID:         uid,
			})
		}
		err = tx.Table("notification_users").
			Create(&nortificationUsers).Error
		if err != nil {
			return err
		}
		return tx.Table("notifications").
			Where("id = ?", notification.ID).
			Update("is_published", true).Error
	})
}

func (h *Hub) UpdateScoreBoard(eventID int, w http.ResponseWriter) error {
	sbData, err := h.FetchScoreboardData(w, eventID, nil)
	if err != nil {
		return err
	}
	data := WsEvent{
		Event:   "update",
		EventID: eventID,
		Payload: sbData,
	}
	select {
	case h.GlobalChan <- data:
		log.Printf("DEBUG - WebSocket - Scoreboard for event %d has been successfully updated", eventID)
	case <-time.After(h.Conf.BroadcastTimeout):
		log.Printf("WARNING - WebSocket - Scoreboard for event %d could not be updated", eventID)
	}
	return nil
}

func (h *Hub) IsChallengeUnlocked(link CtfsChallenge, teamID *int) (bool, error) {
	if link.IsHidden != nil {
		return false, nil
	}
	if link.ReleasedAt != nil && link.ReleasedAt.After(time.Now()) {
		return false, nil
	}
	if link.RequiresChallengeId != nil {
		if teamID == nil {
			return false, nil
		}
		var solve Solve
		result := h.Db.Table("solves").
			Where("chall_id = ? AND team_id = ?", *link.RequiresChallengeId, *teamID).
			Limit(1).
			Find(&solve)
		if result.Error != nil {
			return false, result.Error
		}
		if !(result.RowsAffected > 0) {
			return false, nil
		}
	}
	return true, nil
}

func (h *Hub) CheckVisibility(userRole string, eventID int, userID *int) (bool, error) {
	if userID == nil {
		return false, nil
	}
	if userRole != "admin" {
		if userRole == "organizer" {
			isOwner, err := h.IsOwner(eventID, *userID)
			if err != nil {
				return false, err
			}
			if !isOwner {
				return false, nil
			}
		} else {
			return false, nil
		}
	}
	return true, nil
}
func (h *Hub) GetUserStatus(hasprivilege bool, userID *int, eventID int) (UserStatus, *int) {
	var userInfo UserStatus
	userInfo.IsOrganizer = false
	userInfo.IsGuest = false
	userInfo.IsJoined = false
	var participationTeam *int
	if userID == nil {
		userInfo.IsGuest = true
		return userInfo, nil
	}
	switch hasprivilege {
	case true:
		userInfo.IsOrganizer = true
		return userInfo, nil
	case false:
		var part Participation
		teamID, err := h.GetTeamIDByUserID(*userID)
		if err == nil {
			participationTeam = &teamID
			err := h.Db.Where("ctf_id = ? AND team_id = ?", eventID, teamID).
				First(&part).Error
			if err == nil {
				userInfo.IsJoined = true
				return userInfo, participationTeam
			}
		}
	}
	return userInfo, nil
}

func (h *Hub) CountChallenges(hasprivilege bool, eventID int, teamID *int) (int64, error) {
	var count int64
	if hasprivilege {
		err := h.Db.Table("ctfs_challenges").
			Where("ctf_id = ?", eventID).
			Count(&count).Error
		if err != nil {
			return 0, err
		}
		return count, nil
	} else {
	}
	var challenges []CtfsChallenge
	var unlockedChallenges []CtfsChallenge
	err := h.Db.Table("ctfs_challenges").
		Where("ctf_id = ?", eventID).
		Find(&challenges).Error
	if err != nil {
		return 0, err
	}
	for _, challenge := range challenges {
		isUnlocked, err := h.IsChallengeUnlocked(challenge, teamID)
		if err != nil {
			return 0, err
		}
		if isUnlocked {
			unlockedChallenges = append(unlockedChallenges, challenge)
		}
	}
	count = int64(len(unlockedChallenges))
	return count, nil
}

func (h *Hub) GetOrganizersInfo(eventID int) ([]OrganizersInfo, error) {
	var organizersInfo []OrganizersInfo
	err := h.Db.Table("ctf_organizers").
		Joins("JOIN profiles ON ctf_organizers.organizer_id = profiles.id").
		Select("profiles.username, profiles.avatar").
		Where("ctf_id = ?", eventID).
		Find(&organizersInfo).Error
	return organizersInfo, err
}
