package service

import (
	"notification-service/model"
	"notification-service/config"
	"sync"
	"gorm.io/gorm"
	"github.com/gorilla/websocket"
	"net/http"
)

type Hub struct {
	Db					*gorm.DB
	Clients				map[string]*Client
	BroadcastChan		chan model.NotificationResponse
	Conf				*config.Config
	RegisterChan		chan *Client
	UnregisterChan		chan *Client
	Mutex          		sync.Mutex
	Upgrader       		websocket.Upgrader
}

func NewHub(db *gorm.DB, conf *config.Config) *Hub {
	return &Hub{
		Db: db,
		Clients: make(map[string]*Client),
		Conf: conf,
		BroadcastChan: make(chan model.NotificationResponse, conf.GlobalBuffer),
		RegisterChan: make(chan *Client, conf.RegisterBuffer),
		UnregisterChan: make(chan *Client, conf.RegisterBuffer),
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

