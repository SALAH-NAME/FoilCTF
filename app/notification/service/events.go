package service

import (
	"log"
	"time"

	"kodaic.ma/notification/model"
)

func HandleJoin(hub *Hub, client *Client) {
	hub.Mutex.Lock()
	if _, ok := hub.Clients[client.ID]; !ok {
		hub.Clients[client.ID] = make(map[*Client]bool)
	}
	hub.Clients[client.ID][client] = true
	hub.Mutex.Unlock()
	log.Printf("INFO: userID: %s has joined the server", client.ID)
}

func HandleUnjoin(hub *Hub, client *Client) {
	client.Connection.Close()
	hub.Mutex.Lock()
	if connections, ok := hub.Clients[client.ID]; ok {
		delete(connections, client)
		if len(connections) == 0 {
			delete(hub.Clients, client.ID)
		}
	}
	hub.Mutex.Unlock()
	log.Printf("INFO: userID: %s has left the server", client.ID)
}

func HandleWsEvent(hub *Hub, eventws *model.WsEvent) {
	switch eventws.Event {
	case "new":
		BroadcastNotification(hub, eventws)
	case "read", "read_all", "delete", "delete_all":
		SendToUser(hub, eventws)
	default:
		log.Printf("ERROR: Unknown event type received %s", eventws.Event)
	}
}

func BroadcastNotification(hub *Hub, eventws *model.WsEvent) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	for _, connections := range hub.Clients {
		for client := range connections {
			go SendToClient(hub, client, *eventws)
		}
	}
}

func SendToClient(hub *Hub, client *Client, ev model.WsEvent) {
	select {
	case client.Send <- ev:
	case <-time.After(hub.Conf.BroadcastTimeout):
		{
			log.Printf("userid %s timed out, disconnecting", client.ID)
			hub.UnregisterChan <- client
		}
	}
}

func SendToUser(hub *Hub, eventws *model.WsEvent) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	if connections, ok := hub.Clients[eventws.TargetID]; ok {
		for client := range connections {
			go SendToClient(hub, client, *eventws)
		}
	}
}
