package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (h *Hub) CalculateNewReward(link *CtfsChallenge) int {
	if !link.RewardDecrements {
		return link.Reward
	}
	if link.Solves >= link.Decay {
		return link.RewardMin
	}
	fInitial := float64(link.InitialReward)
	fDecay := float64(link.Decay)
	fMin := float64(link.RewardMin)
	fSolves := float64(link.Solves)
	value := ((fMin-fInitial)/math.Pow(fDecay, 2))*
		math.Pow(fSolves, 2) + fInitial
	nextReward := int(math.Ceil(value))
	if nextReward < link.RewardMin {
		return link.RewardMin
	}
	return nextReward
}

func (h *Hub) ProcessSolve(eventID, challengeID, teamID int, sumbittedFlag string) (bool, int, error) {
	var isFirstBlood bool
	var pointsToAward int
	err := h.Db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		// lock challenge instance
		var link CtfsChallenge
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("ctf_id = ? AND challenge_id = ?", eventID, challengeID).
			First(&link).Error
		if err != nil {
			return err
		}
		// check if already solved
		if tx.Table("solves").
			Where("ctf_id = ? AND chall_id = ? AND team_id = ?", eventID, challengeID, teamID).
			Find(&Solve{}).RowsAffected > 0 {
			return errors.New("already solved")
		}
		// update attemps count and the time of last attempt
		link.Attempts++
		err = tx.Model(&link).
			Update("attempts", link.Attempts).Error
		if err != nil {
			return err
		}
		err = tx.Table("participations").
			Where("ctf_id = ? AND team_id = ?", eventID, teamID).
			Update("last_attempt_at", now).Error
		if err != nil {
			return err
		}
		// check if the flag is correct
		if !h.VerifyFlag(link.Flag, sumbittedFlag) {
			return errors.New("incorrect flag")
		}
		// update the reward based on the number of solves
		oldReward := link.Reward
		link.Reward = h.CalculateNewReward(&link)
		pointsToAward = link.Reward
		link.Solves++
		// losspoints is used to update(subtract from) the score of teams who already solved the same challenge
		lossPoints := oldReward - link.Reward

		// check if first blood and update relevant culomns
		isFirstBlood = (link.FirstBloodAt == nil)
		if isFirstBlood {
			pointsToAward += link.RewardFirstBlood
			link.FirstBloodAt = &now
			link.FirstbloodId = &teamID
		}
		// update the number of solves and first blood related columns in challange instance
		err = tx.Model(&link).
			Select("solves", "first_blood_at", "first_blood_id", "reward").
			Updates(&link).Error
		if err != nil {
			return err
		}
		// update the score of teams who already solved the challenge
		if lossPoints > 0 {
			subQuery := tx.Table("solves").
				Select("team_id").
				Where("chall_id = ? AND ctf_id = ? ", challengeID, eventID)
			if subQuery.Error != nil {
				return subQuery.Error
			}
			err := tx.Table("participations").
				Where("ctf_id = ? AND team_id IN (?)", eventID, subQuery).
				Update("score", gorm.Expr("score - ?", lossPoints)).Error
			if err != nil {
				return err
			}
		}
		// update the solve history table
		updatedSolve := Solve{
			CtfID:       eventID,
			ChallengeID: challengeID,
			TeamID:      teamID,
			Score:       pointsToAward,
			CreatedAt:   time.Now(),
		}
		err = tx.Table("solves").Create(&updatedSolve).Error
		if err != nil {
			return err
		}
		// update the score and number of solves of the team
		updateParticipations := map[string]any{
			"score":  gorm.Expr("score + ?", pointsToAward),
			"solves": gorm.Expr("solves + 1"),
		}
		err = tx.Table("participations").
			Where("ctf_id = ? AND team_id = ?", eventID, teamID).
			Updates(&updateParticipations).Error
		if err != nil {
			return err
		}
		return nil
	})
	return isFirstBlood, pointsToAward, err
}

func (h *Hub) SubmitFlag(w http.ResponseWriter, r *http.Request) {
	eventID, _ := h.ReadIntParam(r, "id")

	challengeID, err := h.ReadIntParam(r, "chall_id")
	if err != nil {
		log.Printf("DEBUG - Flag Submission - Invalid challenge id: %v", err)
		JSONError(w, "Invalid challengeID", http.StatusBadRequest)
		return
	}

	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("DEBUG - Flag Submission - Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	teamID, ok := r.Context().Value(teamIDKey).(int)
	if !ok {
		log.Printf("DEBUG - Flag Submission - Could not get team id from the context for user %d: %v", *userID, err)
		JSONError(w, "Team not found", http.StatusNotFound)
		return
	}

	var req FlagRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR - Flag Submission - Invalid request format: %v", err)
		JSONError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	isFirstBlood, finalPoints, err := h.ProcessSolve(eventID, challengeID, teamID, req.Flag)
	if err != nil {
		HandleSubmitError(w, err)
		return
	}
	if isFirstBlood {
		msg := fmt.Sprintf("Team %d solved chalenge %d!", teamID, challengeID)
		if err := h.Notify("🩸 First Blood!", msg, eventID); err != nil {
			log.Printf("ERROR - Flag Submission - Could not send first blood notification: %v", err)
		}
	}

	if err := h.UpdateScoreBoard(eventID, w); err != nil {
		log.Printf("ERROR - Flag Submission - Could not fetch scoreboard data due to: %v", err)
		JSONError(w, "Could not fetch data", http.StatusInternalServerError)
		return
	}

	resp := map[string]any{
		"status":        "correct",
		"first_blood":   isFirstBlood,
		"points_earned": finalPoints,
	}
	JSONResponse(w, resp, http.StatusOK)
}

func (h *Hub) JoinEvent(w http.ResponseWriter, r *http.Request) {
	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("DEBUG - Join - Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("DEBUG - Join - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}

	teamID, ok := r.Context().Value(teamIDKey).(int)
	if !ok {
		log.Printf("DEBUG - Join - Could not get team id for user %d from the request context", *userID)
		JSONError(w, "Team not found", http.StatusNotFound)
		return
	}

	var roomInstance ChatRoom
	var globalChatRoomID int

	err = h.Db.Transaction(func(tx *gorm.DB) error {
		var team Team
		err = tx.First(&team, teamID).Error
		if err != nil {
			return errors.New("team not found")
		}

		var currentPanticipants int64
		err := tx.Table("participations").Where("ctf_id = ?", event.ID).
			Count(&currentPanticipants).Error
		if err != nil {
			return err
		}

		if event.MaxTeams != nil && *event.MaxTeams <= int(currentPanticipants) {
			return errors.New("event is full")
		}
		if team.TeamSize < event.TeamMembersMin || team.TeamSize > event.TeamMembersMax {
			return errors.New("invalid team size")
		}

		participation := Participation{
			TeamID: teamID,
			CtfID:  event.ID,
			Score:  0,
		}
		err = tx.Table("participations").
			Create(&participation).Error
		if err != nil {
			return errors.New("already registered")
		}

		roomInstance = ChatRoom{
			CtfID:     event.ID,
			TeamID:    &teamID,
			Room_Type: "team",
		}
		err = tx.Table("chat_rooms").Create(&roomInstance).Error
		if err != nil {
			return err
		}

		err = tx.Table("chat_rooms").
			Where("ctf_id = ? AND room_type = 'global'", event.ID).
			Pluck("id", &globalChatRoomID).
			Error
		if err != nil || globalChatRoomID == 0 {
			return errors.New("ctf chat room not found")
		}
		return nil
	})
	if err != nil {
		HandleJoinError(w, err)
		return
	}

	resp := map[string]any{
		"event":          event,
		"registered":     true,
		"team_id":        teamID,
		"team_chat_room": roomInstance.ID,
		"ctf_chat_room":  globalChatRoomID,
	}
	JSONResponse(w, resp, http.StatusCreated)
}

func (h *Hub) ListCtfsChallenges(w http.ResponseWriter, r *http.Request) {
	userID, _, err := GetUserInfo(r)
	if err != nil {
		log.Printf("DEBUG - List Ctfs - Unauthorized: %v", err)
		JSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	event, ok := r.Context().Value(eventKey).(Ctf)
	if !ok {
		log.Printf("DEBUG - List Ctfs - Could not get event from the request context")
		JSONError(w, "event not found", http.StatusNotFound)
		return
	}

	teamID, ok := r.Context().Value(teamIDKey).(int)
	if !ok {
		log.Printf("DEBUG - Join - Could not get team id for user %d from the request context", *userID)
		JSONError(w, "Team not found", http.StatusNotFound)
		return
	}

	// fetch the teams's solved challenge ids
	solvedMap := make(map[int]bool)
	var solvedIDs []int
	err = h.Db.Table("solves").
		Where("team_id = ?", teamID).
		Pluck("chall_id", &solvedIDs).Error
	if err != nil {
		log.Printf("ERROR - List Ctfs - Could not query solved challenge ids: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	for _, id := range solvedIDs {
		solvedMap[id] = true
	}

	// get required challenge data
	unfilteredChallenges := []UnfilteredCtfChallenges{}
	err = h.Db.Table("ctfs_challenges").
		Select("ctfs_challenges.challenge_id AS id, challenges.name, challenges.description, "+
			"challenges.category, ctfs_challenges.reward, ctfs_challenges.solves, "+
			"ctfs_challenges.is_hidden, ctfs_challenges.released_at, ctfs_challenges.requires_challenge_id").
		Joins("INNER JOIN challenges on ctfs_challenges.challenge_id = challenges.id").
		Where("ctfs_challenges.ctf_id = ?", event.ID).
		Scan(&unfilteredChallenges).Error
	if err != nil {
		log.Printf("ERROR - List Ctfs - Could not query challenge data: %v", err)
		JSONError(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// filtering locked challenges,
	// grouping challenges by category
	// and setting isSolved data
	grouped := make(map[string][]PlayerChallengeView)
	for _, challenge := range unfilteredChallenges {
		link := CtfsChallenge{
			ReleasedAt:          challenge.ReleasedAt,
			IsHidden:            challenge.IsHidden,
			RequiresChallengeId: challenge.RequiresChallengeId,
		}
		isUnlocked, err := h.IsChallengeUnlocked(link, &teamID)
		if err != nil {
			log.Printf("ERROR - List Ctfs - Could check if the challenge is unlocked: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if !isUnlocked {
			continue
		}
		challenge.PlayerChallengeView.IsSolved = solvedMap[challenge.PlayerChallengeView.ID]
		category := challenge.PlayerChallengeView.Category
		if category == "" {
			category = "General"
		}
		grouped[category] = append(grouped[category], challenge.PlayerChallengeView)

	}

	JSONResponse(w, grouped, http.StatusOK)
}
