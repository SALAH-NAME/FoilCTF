package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"log"
	"net/http"
	"strconv"
	"time"
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
	log.Printf("Join registration failed: %v", err)
	errorMap := map[string]int{
		"event not found":    http.StatusNotFound,
		"team not found":     http.StatusNotFound,
		"event is full":      http.StatusForbidden,
		"invalid team size":  http.StatusPreconditionFailed,
		"already registated": http.StatusConflict,
	}
	code, exists := errorMap[err.Error()]
	if !exists {
		JSONError(w, "Internal Server error", http.StatusInternalServerError)
		return
	}
	JSONError(w, err.Error(), code)
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
	log.Printf("ORIGINAL:%s", flagContent)
	log.Printf("SUBMITTED:%s", submittedFlag)
	// todo(regex)
	switch flagType {
	case "static":
		return flagContent == submittedFlag
	default:
		return flagContent == submittedFlag
	}
}

func HandleSubmitError(w http.ResponseWriter, err error) {
	log.Printf("Flag validation failed: %v", err)
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

func (h *Hub) Notify(ntype, title, message, link string) error {
	content := map[string]string{
		"type":    ntype,
		"title":   title,
		"message": message,
		"link":    link,
	}
	contentJSON, err := json.Marshal(content)
	if err != nil {
		return err
	}
	notification := Notification{
		CreatedAt: time.Now(),
		Contents:  contentJSON,
	}
	err = h.Db.Table("notifications").Create(&notification).Error
	if err != nil {
		return err
	}
	return nil
}

func (h *Hub) UpdateScoreBoard(eventID int, w http.ResponseWriter) error {
	sbData, err := h.FetchScoreboardData(w, eventID)
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
		log.Printf("Successfully updated scoreboard for eventid: %d", eventID)
	case <-time.After(h.Conf.BroadcastTimeout):
		log.Printf("WARNING: Broadcast channel full for ScoreBoard, eventID: %d", eventID)
	}
	return nil
}
