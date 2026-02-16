package main

import (
	"log"
	"net/http"
)

func (h *Hub) ListEvents(w http.ResponseWriter, r *http.Request) {
	events := []Ctf{}

	err := h.Db.Table("ctfs").
		Where("status IN (?)", []string{"active", "published","ended", "archived"}).
		Order("start_time DESC").
		Find(&events).Error
	if err != nil {
		log.Printf("Database Error: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	JSONResponse(w, events, http.StatusOK)
}

func (h *Hub) GetEvent(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusInternalServerError)
		return
	}
	if event.Status == "draft" {
		JSONError(w, "Event is not accessible", http.StatusForbidden)
		return
	}
	JSONResponse(w, event, http.StatusOK)
}

func (h *Hub) GetScoreboard(w http.ResponseWriter, r *http.Request) {
	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("Could not get event form context")
		JSONError(w, "event not found", http.StatusInternalServerError)
		return
	}
	switch event.Status {
	case "active":
		h.ServeScoreboardWs(w, r, event.ID)
	case "ended":
		sbData, err := h.FetchScoreboardData(w, event.ID)
		if err != nil {
			log.Printf("Could not fetch scorebord data due to : %v", err)
			JSONError(w, "Could not fetch data", http.StatusInternalServerError)
			return
		}
		JSONResponse(w, sbData, http.StatusOK)
	default:
		JSONError(w, "Event is not accessible", http.StatusForbidden)
	}
}
