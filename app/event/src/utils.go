package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

func GetUserInfo(r *http.Request) (string, string, error) {
	userID, okID := r.Context().Value(userIDKey).(string)
	userRole, okRole := r.Context().Value(userRoleKey).(string)
	if !okID || !okRole || userID == "" || userRole == "" {
		return "", "", fmt.Errorf("User identity missing from the context")
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

func (h *Hub) GetTeamIDByUserID(userID string) (int, error) {
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
	var flagDetails struct {
		Type  string `json:"type"`
		Value string `json:"value"`
	}
	// for scalability
	switch flagDetails.Type {
	case "static":
		return flagDetails.Value == submittedFlag
	default:
		return flagDetails.Value == submittedFlag
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
