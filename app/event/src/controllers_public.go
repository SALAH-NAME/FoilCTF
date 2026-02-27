package main

import (
	"log"
	"net/http"
	"slices"

	"gorm.io/gorm"
)


func (h *Hub) ListEvents(w http.ResponseWriter, r *http.Request) {
	pagination := ParsePagination(r)

	statusFilter := ParsePaginationString(r, "status")
	statusFilters := []string{ "active", "draft", "published", "ended" }

	sortOrder := "CASE WHEN status = 'active' THEN 0 ELSE 1 END, start_time DESC"
	if pagination.Sort {
		sortOrder = "CASE WHEN status = 'active' THEN 0 ELSE 1 END, start_time ASC"
	}

	var query *gorm.DB
	if slices.Contains(statusFilters, statusFilter) {
		query = h.Db.Table("ctfs").Where("name LIKE ? AND status = ?", pagination.Search, statusFilter)
	} else {
		query = h.Db.Table("ctfs").Where("name LIKE ?", pagination.Search)
	}

	var count int64
	query.Count(&count)

	var events []Ctf
	query.Select("ctfs.*, COUNT(p.team_id) AS teams_count").Order(sortOrder).Limit(pagination.Limit).Offset(pagination.Offset).Joins("LEFT JOIN participations p ON p.ctf_id = ctfs.id").Group("ctfs.id").Find(&events)
	if query.Error != nil {
		log.Printf("ERROR - Database - Could not query events: %v", query.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	JSONResponse(w, map[string]any{ "events": events, "count": count }, http.StatusOK)
}

func (h *Hub) GetEvent(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(userIDKey).(*int)
	userRole, _ := r.Context().Value(userRoleKey).(string)
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("DEBUG - HTTP - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}

	var has_privilege bool
	has_privilege, err := h.CheckVisibility(userRole, event.ID, userID)
	if err != nil {
		log.Printf("ERROR - Database - Could not check event visibility: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if event.Status == "draft" && !has_privilege {
		JSONError(w, "Event Not Found", http.StatusNotFound)
		return
	}

	userStatus, participationTeam := h.GetUserStatus(has_privilege, userID, event.ID)
	eventDetails := EventDetails{
		Name:           event.Name,
		TeamMembersMax: event.TeamMembersMax,
		TeamMembersMin: event.TeamMembersMin,
		MetaData:       event.MetaData,
		StartTime:      event.StartTime,
		EndTime:        event.EndTime,
		Status:         event.Status,
	}
	err = h.Db.Table("participations").
		Count(&eventDetails.ParticipationCount).Error
	if err != nil {
		log.Printf("ERROR - Database - Could not query participations: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	eventDetails.ChallengeCount, err = h.CountChallenges(has_privilege, event.ID, participationTeam)
	if err != nil {
		log.Printf("ERROR - Database - Could not count challenges: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	organizersInfo, err := h.GetOrganizersInfo(event.ID)
	if err != nil {
		log.Printf("ERROR - Database - Could not get organizers information: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	resp := map[string]any{
		"event_data":  eventDetails,
		"organizers":  organizersInfo,
		"user_status": userStatus,
	}
	if event.Status == "active" || event.Status == "ended" {
		limit := 3
		topTeams, err := h.FetchScoreboardData(w, event.ID, &limit)
		if err != nil {
			log.Printf("ERROR - Database - Could not fetch scoreboard data due to: %v", err)
			JSONError(w, "Could not fetch data", http.StatusInternalServerError)
			return
		}
		resp["top_teams"] = topTeams
	}

	JSONResponse(w, resp, http.StatusOK)
}

func (h *Hub) GetScoreboard(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("ERROR - HTTP - Could not get the event from the context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}
	switch event.Status {
	case "active":
		h.ServeScoreboardWs(w, r, event.ID)
	case "ended":
		sbData, err := h.FetchScoreboardData(w, event.ID, nil)
		if err != nil {
			log.Printf("ERROR - Database - Could not fetch scoreboard data due to: %v", err)
			JSONError(w, "Could not fetch data", http.StatusInternalServerError)
			return
		}
		JSONResponse(w, sbData, http.StatusOK)
	default:
		JSONError(w, "Event is not accessible", http.StatusForbidden)
	}
}
