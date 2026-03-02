package main

import (
	"log"
	"net/http"
	"slices"
)

func (h *Hub) ListEvents(w http.ResponseWriter, r *http.Request) {
	userRole, _ := r.Context().Value(userRoleKey).(string)

	pagination := ParsePagination(r)
	filterStatus := ParsePaginationString(r, "status")
	filterStatuses := []string{"active", "draft", "published", "ended"}

	sortOrder := "CASE WHEN status = 'active' THEN 0 ELSE 1 END, start_time DESC"
	if pagination.Sort {
		sortOrder = "CASE WHEN status = 'active' THEN 0 ELSE 1 END, start_time ASC"
	}

	query := h.Db.Table("ctfs").Where("name LIKE ?", pagination.Search)
	if slices.Contains(filterStatuses, filterStatus) {
		query = query.Where("status = ?", filterStatus)
	}
	if userRole != "admin" {
		query = query.Where("status <> 'draft'")
	}

	var count int64
	query.Count(&count)

	var events []Ctf
	query.Select("ctfs.*, COUNT(p.team_id) AS teams_count").
		Order(sortOrder).
		Limit(pagination.Limit).
		Offset(pagination.Offset).
		Joins("LEFT JOIN participations p ON p.ctf_id = ctfs.id").
		Group("ctfs.id").
		Find(&events)
	if query.Error != nil {
		log.Printf("ERROR - Database - Could not query events: %v", query.Error)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	JSONResponse(w, map[string]any{"events": events, "count": count}, http.StatusOK)
}

func (h *Hub) GetEvent2(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(userIDKey).(*int)
	userRole, _ := r.Context().Value(userRoleKey).(string)

	event, eventOK := r.Context().Value(eventKey).(Ctf)
	if !eventOK {
		log.Printf("DEBUG - HTTP - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}

	var err error
	var hasPrivilege bool
	if hasPrivilege, err = h.CheckVisibility(userRole, event.ID, userID); err != nil {
		log.Printf("ERROR - Database - Could not check event visibility: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if event.Status == "draft" && !hasPrivilege {
		JSONError(w, "Event Not Found", http.StatusNotFound)
		return
	}

	eventDetails := EventDetails{
		Name:           event.Name,
		Description:    event.Description,
		TeamMembersMax: event.TeamMembersMax,
		TeamMembersMin: event.TeamMembersMin,
		MetaData:       event.MetaData,
		StartTime:      event.StartTime,
		EndTime:        event.EndTime,
		Status:         event.Status,
		MaxTeams:       event.MaxTeams,
	}

	err = h.Db.
		Table("participations").
		Where("ctf_id = ?", event.ID).
		Count(&eventDetails.ParticipationCount).
		Error
	if err != nil {
		log.Printf("ERROR - Database - Could not query participations: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	userStatus, participationTeam := h.GetUserStatus(hasPrivilege, userID, event.ID)
	eventDetails.ChallengeCount, err = h.CountChallenges(hasPrivilege, event.ID, participationTeam)
	if err != nil {
		log.Printf("ERROR - Database - Could not count challenges: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// TODO(xenobas): Continue work on integrating the team count in the get events join

	organizersInfo, err := h.GetOrganizersInfo(event.ID)
	if err != nil {
		log.Printf("ERROR - Database - Could not get organizers information: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	resp := map[string]any{
		"event":       eventDetails,
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

func (h *Hub) GetEvent(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(userIDKey).(*int)
	userRole, _ := r.Context().Value(userRoleKey).(string)
	eventData, eventExists := r.Context().Value(eventKey).(Ctf)
	if !eventExists {
		JSONError(w, "Event Not Found", http.StatusNotFound)
		return
	}

	// TODO(xenobas): Use a transaction

	// SECTION: Privilege
	if eventData.Status == "draft" && (userRole != "admin" || userID == nil) {
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// SECTION: Organizers
	organizersInfo, err := h.GetOrganizersInfo(eventData.ID)
	if err != nil {
		log.Printf("ERROR - Event - Could not query organizers info due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// SECTION: User status
	var userStatus UserStatus
	userStatus.IsGuest = userID == nil
	userStatus.IsOrganizer = userRole == "admin"
	if eventData.Status != "draft" && userID != nil {
		var user User
		var teamID int
		var participation Participation

		resUser := h.Db.
			Select("team_name").
			Table("users").
			Where("id = ?", *userID).
			Find(&user)
		if resUser.Error != nil {
			log.Printf("ERROR - Event - Could not query user status user due to: %v", resUser.Error)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		resTeam := h.Db.
			Select("id").
			Table("teams").
			Where("name = ?", user.TeamName).
			Scan(&teamID)
		if resTeam.Error != nil {
			log.Printf("ERROR - Event - Could not query user status team due to: %v", resTeam.Error)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		resParticipation := h.Db.
			Table("participations").
			Where("ctf_id = ? AND team_id = ?", eventData.ID, teamID).
			Find(&participation)
		if resParticipation.Error != nil {
			log.Printf("ERROR - Event - Could not query user status participation due to: %v", resParticipation.Error)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		userStatus.IsJoined = resParticipation.RowsAffected == 1
	}

	// SECTION: Top teams
	var topTeams []TeamData
	if eventData.Status == "active" || eventData.Status == "ended" {
		topTeamsLimit := 3
		if topTeams, err = h.FetchScoreboardData(w, eventData.ID, &topTeamsLimit); err != nil {
			log.Printf("ERROR - Database - Could not query top teams list due to: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
	}

	// SECTION: Participation count
	var participationCount int64
	if eventData.Status != "draft" {
		err := h.Db.
			Table("participations").
			Where("ctf_id = ?", eventData.ID).
			Count(&participationCount).
			Error
		if err != nil {
			log.Printf("ERROR - Event - Could not count participations due to: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
	}

	// SECTION: Challenge count
	var challengeCount int64
	if err := h.Db.
		Table("ctfs_challenges").
		Where("ctf_id = ?", eventData.ID).
		Count(&challengeCount).
		Error; err != nil {
		log.Printf("ERROR - Event - Could not count challenges due to: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// SECTION: Event details
	event := EventDetails{
		Name:           eventData.Name,
		Description:    eventData.Description,
		TeamMembersMin: eventData.TeamMembersMin,
		TeamMembersMax: eventData.TeamMembersMax,
		MetaData:       eventData.MetaData,
		StartTime:      eventData.StartTime,
		EndTime:        eventData.EndTime,
		Status:         eventData.Status,
		MaxTeams:       eventData.MaxTeams,

		ChallengeCount:     challengeCount,
		ParticipationCount: participationCount,
	}

	resp := map[string]any{
		"event":       event,
		"organizers":  organizersInfo,
		"user_status": userStatus,
		"top_teams":   topTeams,
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
