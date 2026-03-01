package main

import (
	"context"
	"log"
	"time"

	"gorm.io/gorm"
)

func (h *Hub) SyncCtfStatus() {
	// TODO(xenobas): We might need a flag that disables this behaviour?
	err := h.Db.Transaction(func(tx *gorm.DB) error {
		var res *gorm.DB

		res = tx.
			Table("ctfs").
			Where("status = 'published' AND now() > start_time").
			Updates(Ctf{Status: "active"})
		if res.Error != nil {
			return res.Error
		}
		rowsAffectedActive := res.RowsAffected

		res = tx.
			Table("ctfs").
			Where("status = 'active' AND now() > end_time").
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
