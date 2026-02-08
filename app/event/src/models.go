package main

import (
	"time"

	"gorm.io/gorm"
)

type EventRequest struct {
	Name           string         `json:"name"`
	TeamMembersMin int            `json:"mix"`
	TeamMembersMax int            `json:"max"`
	MetaData       map[string]any `json:"metadata"`
	StartTime      time.Time      `json:"start_time"`
	EndTime        time.Time      `json:"end_time"`
}

type Ctf struct {
	ID             int            `json:"id" gorm:"primaryKey;autoIncrement"`
	Name           string         `json:"name" gorm:"column:name"`
	TeamMembersMin int            `json:"mix" gorm:"column:team_members_min"`
	TeamMembersMax int            `json:"max" gorm:"column:team_members_max"`
	MetaData       map[string]any `json:"metadata" gorm:"column:metadata;serializer:json"`
	StartTime      time.Time      `json:"start_time" gorm:"column:start_time"`
	EndTime        time.Time      `json:"end_time" gorm:"column:end_time"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	Status         string         `json:"status" gorm:"column:status"`
}

type CtfOrganizers struct {
	CtfID       int    `json:"ctf_id" gorm:"column:ctf_id"`
	OrganizerID string `json:"organizer_id" gorm:"column:organizer_id"`
}

type LinkChallenge struct {
	CtfID       int            `json:"ctf_id" gorm:"column:ctf_id"`
	ChallengeID int            `json:"challenge_id" gorm:"column:challenge_id"`
	Reward      int            `json:"reward" gorm:"column:reward"`
	Flag        map[string]any `json:"flag" gorm:"column:flag"`
}
