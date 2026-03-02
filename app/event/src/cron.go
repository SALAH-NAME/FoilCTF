package main

import (
	"fmt"
	"log"
	"time"
	"context"
	"encoding/json"

	"gorm.io/gorm"
)

func (h *Hub) SyncCtfStatus() {
	// TODO(xenobas): We might need a flag that disables this behaviour?
	err := h.Db.Transaction(func(tx *gorm.DB) error {
		var res *gorm.DB
		now := time.Now()


		var rows []struct {
			UserID int `gorm:"column:user_id"`
			CtfID  int `gorm:"column:ctf_id"`
			CtfName string `gorm:"column:ctf_name"`
		}

		res = tx.
			Table("ctfs").
			Select("u.id as user_id, ctfs.id as ctf_id, ctfs.name as ctf_name").
			Joins("LEFT JOIN participations p ON p.ctf_id = ctfs.id").
			Joins("LEFT JOIN teams t ON p.team_id = t.id").
			Joins("LEFT JOIN users u ON u.team_name = t.name").
			Where("ctfs.status = 'published' AND ctfs.start_time < ?", now).
			Scan(&rows)
		if res.Error != nil {
			return res.Error
		}

		// TODO(xenobas): Continue work on notification triggers
		res = tx.
			Table("ctfs").
			Where("status = 'published' AND ? > start_time", now).
			Updates(Ctf{Status: "active"})
		if res.Error != nil {
			return res.Error
		}
		rowsAffectedActive := res.RowsAffected

		if len(rows) > 0 {
			ctfIDToNotificationID := make(map[int]int)

			notificationUsers := make([]NotificationUsers, len(rows))
			for index := range rows {
				row := rows[index]

				notificationID, exists := ctfIDToNotificationID[row.CtfID]
				if !exists {
					contentsMap := map[string]string {
						"type": "event",
						"title": "Event started",
						"message": fmt.Sprintf("%s has started", row.CtfName),
					}
					contentsJSON, err := json.Marshal(contentsMap)
					if err != nil {
						return err
					}

					notif := Notification{
						Contents: contentsJSON,
					}
					res = h.Db.Table("notifications").Create(&notif)
					if res.Error != nil {
						return res.Error
					}

					ctfIDToNotificationID[row.CtfID] = notif.ID
					notificationID = notif.ID
				}

				notificationUsers[index].UserID = row.UserID;
				notificationUsers[index].NotificationID = notificationID;
			}

			for _, notificationID := range ctfIDToNotificationID {
				res = tx.
					Table("notifications").
					Where("id = ?", notificationID).
					Updates(Notification{ IsPublished: true })
				if res.Error != nil {
					return res.Error
				}
			}
			tx.CreateInBatches(notificationUsers, 50)
		}

		res = tx.
			Table("ctfs").
			Where("status = 'active' AND ? > end_time", now).
			Updates(Ctf{Status: "ended"})
		if res.Error != nil {
			return res.Error
		}
		rowsAffectedEnded := res.RowsAffected

		if rowsAffectedActive + rowsAffectedEnded > 0 {
			log.Printf("DEBUG - SyncCtfStatus - %d rows set as 'active', and %d set as 'ended'", rowsAffectedActive, rowsAffectedEnded)
		}
		return nil
	})
	if err != nil {
		log.Printf("ERROR - SyncCtfStatus - %v", err)
	}
}

func NewCron(h *Hub, ctx context.Context) {
	for {
		select {
		case <-time.After(time.Second * 3): // TODO(xenobas): Customize this frequency and stop hard coding the number
			h.SyncCtfStatus()
		case <-ctx.Done():
			return
		}
	}
}
