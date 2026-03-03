package main

import (
	"net/http"
)

func (h *Hub) FetchScoreboardData(w http.ResponseWriter, eventID int, limit *int) ([]TeamData, error) {
	teamData := []TeamData{}
	query := h.Db.Table("participations").
		Select("teams.name as team_name, participations.score, participations.last_attempt_at, participations.solves").
		Joins("INNER JOIN teams on participations.team_id = teams.id").
		Where(" participations.ctf_id = ?", eventID).
		Order("participations.score DESC")

	if limit != nil {
		query = query.Limit(*limit)
	}
	err := query.Scan(&teamData).Error
	if err != nil {
		return nil, err
	}
	for i := range teamData {
		teamData[i].Rank = i + 1
	}
	return teamData, nil
}

func (h *Hub) FetchScoreboardDataPaginated(eventID int, search string, limit, offset int) ([]TeamData, int64, error) {
	base := h.Db.Table("participations").
		Select("teams.name as team_name, participations.score, participations.last_attempt_at, participations.solves").
		Joins("INNER JOIN teams on participations.team_id = teams.id").
		Where("participations.ctf_id = ?", eventID).
		Order("participations.score DESC, participations.last_attempt_at ASC")

	if search != "%" {
		base = base.Where("teams.name LIKE ?", search)
	}

	var count int64
	if err := base.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	allTeams := []TeamData{}
	rankQuery := h.Db.Table("participations").
		Select("teams.name as team_name, participations.score, participations.last_attempt_at, participations.solves").
		Joins("INNER JOIN teams on participations.team_id = teams.id").
		Where("participations.ctf_id = ?", eventID).
		Order("participations.score DESC, participations.last_attempt_at ASC")
	if err := rankQuery.Scan(&allTeams).Error; err != nil {
		return nil, 0, err
	}
	rankMap := make(map[string]int, len(allTeams))
	for i, t := range allTeams {
		rankMap[t.TeamName] = i + 1
	}

	page := []TeamData{}
	if err := base.Limit(limit).Offset(offset).Scan(&page).Error; err != nil {
		return nil, 0, err
	}
	for i := range page {
		page[i].Rank = rankMap[page[i].TeamName]
	}
	return page, count, nil
}

func (h *Hub) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}

	if event.Status != "active" && event.Status != "ended" {
		JSONError(w, "leaderboard not available", http.StatusForbidden)
		return
	}

	pagination := ParsePagination(r)

	leaderboard, count, err := h.FetchScoreboardDataPaginated(event.ID, pagination.Search, pagination.Limit, pagination.Offset)
	if err != nil {
		JSONResponse(w, map[string]any{"leaderboard": []TeamData{}, "count": 0}, http.StatusOK)
		return
	}

	JSONResponse(w, map[string]any{"leaderboard": leaderboard, "count": count}, http.StatusOK)
}
