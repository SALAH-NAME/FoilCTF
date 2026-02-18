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
