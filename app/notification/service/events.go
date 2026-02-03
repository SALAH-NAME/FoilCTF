package service

import (
	"log"
	"time"
)

func HandleJoin(hub *Hub, client *Client) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	if _, ok := hub.Clients[client.ID]; !ok {
		hub.Clients[client.ID] = make(map[*Client]bool)
	}
	hub.Clients[client.ID][client] = true
	log.Printf("INFO: userID: %s has joined the server", client.ID)
}

func HandleUnjoin(hub *Hub, client *Client) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	connections, ok := hub.Clients[client.ID]
	if !ok {
		return
	}
	if _, exists := connections[client]; !exists {
		return
	}
	delete(connections, client)
	if len(connections) == 0 {
		delete(hub.Clients, client.ID)
	}
	client.Connection.Close()
	close(client.Send) // now guaranteed to be closed once.
	log.Printf("INFO: userID: %s has left the server", client.ID)
}

func HandleWsEvent(hub *Hub, eventws *WsEvent) {
	switch eventws.Event {
	case "new":
		BroadcastNotification(hub, eventws)
	case "read", "read_all", "delete", "delete_all":
		SendToUser(hub, eventws)
	default:
		log.Printf("ERROR: Unknown event type received %s", eventws.Event)
	}
}

func BroadcastNotification(hub *Hub, eventws *WsEvent) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	for _, connections := range hub.Clients {
		for client := range connections {
			go SendToClient(hub, client, *eventws)
		}
	}
}

func SendToClient(hub *Hub, client *Client, ev WsEvent) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ERROR: Panic in SendToClient for user %s: %v", client.ID, r)
			hub.UnregisterChan <- client
		}
	}()
	select {
	case client.Send <- ev:
	case <-time.After(hub.Conf.BroadcastTimeout):
		{
			log.Printf("userid %s timed out, disconnecting", client.ID)
			hub.UnregisterChan <- client
		}
	}
}

func SendToUser(hub *Hub, eventws *WsEvent) {
	hub.Mutex.Lock()
	defer hub.Mutex.Unlock()
	if connections, ok := hub.Clients[eventws.TargetID]; ok {
		for client := range connections {
			go SendToClient(hub, client, *eventws)
		}
	}
}
