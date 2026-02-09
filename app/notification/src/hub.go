package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type Hub struct {
	Db             *gorm.DB
	Clients        map[string]map[*Client]bool
	GlobalChan     chan WsEvent
	Conf           *Config
	RegisterChan   chan *Client
	UnregisterChan chan *Client
	Mutex          sync.Mutex
	Upgrader       websocket.Upgrader
}

func NewHub(db *gorm.DB, conf *Config) *Hub {
	return &Hub{
		Db:             db,
		Clients:        make(map[string]map[*Client]bool),
		Conf:           conf,
		GlobalChan:     make(chan WsEvent, conf.GlobalBuffer),
		RegisterChan:   make(chan *Client, conf.RegisterBuffer),
		UnregisterChan: make(chan *Client, conf.RegisterBuffer),
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (hub *Hub) TrackChannels() {
	for {
		select {
		case eventws, ok := <-hub.GlobalChan:
			{
				if !ok {
					log.Print("Global event channel closed")
					return
				}
				HandleWsEvent(hub, &eventws)
			}
		case client, ok := <-hub.RegisterChan:
			{
				if !ok {
					log.Print("Register channel closed")
					return
				}
				HandleJoin(hub, client)
			}
		case client, ok := <-hub.UnregisterChan:
			{
				if !ok {
					log.Print("Unegister channel closed")
					return
				}
				HandleUnjoin(hub, client)
			}
		}

	}
}
