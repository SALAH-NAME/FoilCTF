package main

import (
	"time"
	"gorm.io/gorm"
)

type EventRequest struct {
	Name           string         `json:"name"`
	TeamMembersMin int            `json:"min"`
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
	MaxTeams	   int			  `json:"max_teams" gorm:"column:max_teams"`
}

type CtfOrganizers struct {
	CtfID       int    `json:"ctf_id" gorm:"column:ctf_id"`
	OrganizerID string `json:"organizer_id" gorm:"column:organizer_id"`
}
// think of adding a model just for link request
type CtfChallengeLink struct {
	CtfID       	int            	`json:"ctf_id" gorm:"column:ctf_id;primaryKey"`
	ChallengeID 	int            	`json:"challenge_id" gorm:"column:challenge_id;primaryKey"`
	Reward      	int            	`json:"reward" gorm:"column:reward"`
	Flag        	map[string]any 	`json:"flag" gorm:"column:flag, serializer:json"`
	Attempts		int				`json:"attempts" gorm:"column:attempts"`
	Solves			int				`json:"solves" gorm:"column:solves"`
	FirstBloodAt	*time.Time		`json:"first_blood_at" gorm:"column:first_blood_at"`
	FirstbloodId	*int 		`json:"first_blood_id" gorm:"column:first_blood_id"`
	ContainerLimits map[string]any 	`json:"container_limits" gorm:"column:container_limits, serializer:json"`
}

type PlayerChallengeView struct {
	ID    		int    	`json:"id"`
	Name        string 	`json:"name"`
	Description	string	`json:"description"`
	Category	string	`json:"category"`
	Reward		string	`json:"reward"`
	Solves		string 	`json:"solves"`
	IsSoled		bool	`json:"is_solved"`
}

type Participation struct {
	ID 				int	`json:"id" gorm:"primaryKey;autoIncrement"`
	TeamID 			int `json:"team_id" gorm:"team_id"`
	Score  			int  `json:"score" gorm:"column:score"`
	CtfID			int	 `json:"ctf_id" gorm:"column:ctf_id"`
	JoinedAT		time.Time	 `json:"joined_at" gorm:"column:joined_at"`
	LastAttemptAt *time.Time	`json:"last_attempt_at" gorm:"column:last_attempt_at"`
}

type Team struct {
	ID int `gorm:"primaryKey"`
	TeamSize int `gorm:"team_size"`
}

type FlagRequest struct {
	Flag string `json:"flag"`
}

type Challenge struct {
	ID int `gorm:"primaryKey"`
	RewardFirstBlood int `gorm:"column:reward_first_blood"`
	RewardDecrements int `gorm:"column:reward_decrements"`
}

type Solve struct {
	ID int `gorm:"primaryKey"`
	CtfID int `gorm:"column:ctf_id"`
	ChallengeID int `gorm:"column:chall_id"`
	TeamID int `gorm:"column:team_id"`
	Score int `gorm:"column:score"`
	CreatedAt time.Time `gorm:"column:created_at"`
}