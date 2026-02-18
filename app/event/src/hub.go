package main

import (
	"sync"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type Hub struct {
	Db             *gorm.DB
	Clients        map[*Client]bool
	Conf           Config
	Mutex          sync.Mutex
	GlobalChan     chan WsEvent
	RegisterChan   chan *Client
	UnregisterChan chan *Client
	Upgrader       websocket.Upgrader
}

func GetHub(db *gorm.DB, conf Config) *Hub {
	return &Hub{
		Db:             db,
		Clients:        make(map[*Client]bool),
		Conf:           conf,
		GlobalChan:     make(chan WsEvent, conf.GlobalBuffer),
		RegisterChan:   make(chan *Client, conf.RegisterBuffer),
		UnregisterChan: make(chan *Client, conf.RegisterBuffer),
	}
}
