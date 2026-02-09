package main

import (
	"gorm.io/gorm"
)

type Hub struct {
	Db   *gorm.DB
	Conf Config
}

func GetHub(db *gorm.DB, conf Config) *Hub {
	return &Hub{
		Db:   db,
		Conf: conf,
	}
}
