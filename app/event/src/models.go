package main

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type EventRequest struct {
	Name           string         `json:"name"`
	TeamMembersMin int            `json:"team_members_min"`
	TeamMembersMax int            `json:"team_members_max"`
	MetaData       map[string]any `json:"metadata"`
	StartTime      time.Time      `json:"start_time"`
	EndTime        time.Time      `json:"end_time"`
	MaxTeams       int            `json:"max_teams"`
}

type Ctf struct {
	ID             int            `json:"id" gorm:"primaryKey;autoIncrement"`
	Name           string         `json:"name" gorm:"column:name"`
	TeamMembersMin int            `json:"team_members_min" gorm:"column:team_members_min"`
	TeamMembersMax int            `json:"team_members_max" gorm:"column:team_members_max"`
	MetaData       map[string]any `json:"metadata" gorm:"column:metadata;serializer:json"`
	StartTime      time.Time      `json:"start_time" gorm:"column:start_time"`
	EndTime        time.Time      `json:"end_time" gorm:"column:end_time"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	Status         string         `json:"status" gorm:"column:status"`
	MaxTeams       *int           `json:"max_teams" gorm:"column:max_teams"`
}

type CtfOrganizers struct {
	CtfID       int `gorm:"column:ctf_id"`
	OrganizerID int `gorm:"column:organizer_id"`
}

type CtfsChallenge struct {
	CtfID               int            `json:"ctf_id" gorm:"column:ctf_id;primaryKey"`
	ChallengeID         int            `json:"challenge_id" gorm:"column:challenge_id;primaryKey"`
	Reward              int            `json:"reward" gorm:"column:reward;default:500"`
	InitialReward       int            `json:"initial_reward" gorm:"column:initial_reward;default:500"`
	Flag                map[string]any `json:"flag" gorm:"column:flag;serializer:json"`
	RewardFirstBlood    int            `json:"reward_first_blood" gorm:"column:reward_first_blood;default:0"`
	RewardDecrements    bool           `json:"reward_decrements" gorm:"column:reward_decrements;default:true"`
	RewardMin           int            `json:"reward_min" gorm:"column:reward_min;default:350"`
	Decay               int            `json:"decay" gorm:"column:decay;default:30"`
	Attempts            int            `json:"attempts" gorm:"column:attempts"`
	Solves              int            `json:"solves" gorm:"column:solves"`
	FirstBloodAt        *time.Time     `json:"first_blood_at" gorm:"column:first_blood_at"`
	FirstbloodId        *int           `json:"first_blood_id" gorm:"column:first_blood_id"`
	ContainerLimits     map[string]any `json:"container_limits" gorm:"column:container_limits;serializer:json"`
	ReleasedAt          *time.Time     `json:"released_at" gorm:"column:released_at"`
	RequiresChallengeId *int           `json:"requires_challenge_id" gorm:"column:requires_challenge_id"`
	IsHidden            *bool          `json:"is_hidden" gorm:"column:is_hidden"`
}

type Participation struct {
	ID            int        `gorm:"primaryKey;autoIncrement"`
	TeamID        int        `gorm:"column:team_id"`
	Score         int        `gorm:"column:score"`
	CtfID         int        `gorm:"column:ctf_id"`
	Solves        int        `gorm:"column:solves"`
	LastAttemptAt *time.Time `gorm:"column:last_attempt_at"`
}

type Team struct {
	ID       int `gorm:"primaryKey"`
	TeamSize int `gorm:"column:team_size"`
}

type FlagRequest struct {
	Flag string `json:"flag"`
}

type Solve struct {
	ID          int       `gorm:"primaryKey"`
	CtfID       int       `gorm:"column:ctf_id"`
	ChallengeID int       `gorm:"column:chall_id"`
	TeamID      int       `gorm:"column:team_id"`
	Score       int       `gorm:"column:score"`
	CreatedAt   time.Time `gorm:"column:created_at"`
}

type Notification struct {
	ID          int             `gorm:"primaryKey"`
	CreatedAt   time.Time       `gorm:"column:created_at"`
	Contents    json.RawMessage `gorm:"column:contents;type:json"`
	IsPublished bool            `gorm:"column:is_published"`
}

type NotificationUsers struct {
	NotificationID int `gorm:"column:notification_id"`
	UserID         int `gorm:"column:user_id;primaryKey"`
}

type TeamData struct {
	Rank          int        `json:"rank"`
	TeamName      string     `json:"team_name"`
	Score         int        `json:"score"`
	Solves        int        `json:"solves"`
	LastAttemptAt *time.Time `json:"last_attempt_at"`
}

type WsEvent struct {
	Event   string      `json:"event"`
	EventID int         `json:"event_id"`
	Payload interface{} `json:"metadata"`
}

type ChatRoom struct {
	ID        int    `gorm:"primaryKey"`
	CtfID     int    `gorm:"column:ctf_id"`
	TeamID    *int   `gorm:"column:team_id"`
	Room_Type string `gorm:"column:room_type"`
}

type EventDetails struct {
	Name               string         `json:"name"`
	TeamMembersMin     int            `json:"team_members_min"`
	TeamMembersMax     int            `json:"team_members_max"`
	MetaData           map[string]any `json:"metadata"`
	StartTime          time.Time      `json:"start_time"`
	EndTime            time.Time      `json:"end_time"`
	Status             string         `json:"status"`
	ParticipationCount int64          `json:"participation_count"`
	ChallengeCount     int64          `json:"challenge_count"`
}

type OrganizersInfo struct {
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

type UserStatus struct {
	IsOrganizer bool `json:"is_organizer"`
	IsGuest     bool `json:"is_guest"`
	IsJoined    bool `json:"is_joined"`
}

type PlayerChallengeView struct {
	ID          int    `json:"id" gorm:"column:id"`
	Name        string `json:"name" gorm:"column:name"`
	Description string `json:"description" gorm:"column:description"`
	Category    string `json:"category" gorm:"column:category"`
	Reward      int    `json:"reward" gorm:"column:reward"`
	Solves      int    `json:"solves" gorm:"column:solves"`
	IsSolved    bool   `json:"is_solved"`
}

type UnfilteredCtfChallenges struct {
	PlayerChallengeView PlayerChallengeView `gorm:"embedded"`
	ReleasedAt          *time.Time          `gorm:"column:released_at"`
	RequiresChallengeId *int                `gorm:"column:requires_challenge_id"`
	IsHidden            *bool               `gorm:"column:is_hidden"`
}
