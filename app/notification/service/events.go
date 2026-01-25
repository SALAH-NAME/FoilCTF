package service

import (
	"log"
	"notification-service/model"
	"time"
)

func HandleJoin(hub *Hub, client *Client) {
	hub.Mutex.Lock()
	hub.Clients[client] = true
	hub.Mutex.Unlock()
	log.Printf("INFO: userID: %s has joined the server", client.ID)
}

func HandleUnjoin(hub *Hub, client *Client) {
	client.Connection.Close()
	close(client.Send)
	hub.Mutex.Lock()
	delete(hub.Clients, client)
	hub.Mutex.Unlock()
	log.Printf("INFO: userID: %s has left the server", client.ID)
}

func HandleWsEvent(hub *Hub, eventws *model.WsEvent) {
	switch eventws.Event{
		case "new":
			BroadcastNotification(hub, eventws)
		case "read", "read_all", "delete", "delete_all":
			SendToUser(hub, eventws)
	}
}


func BroadcastNotification(hub *Hub, eventws *model.WsEvent) {
	hub.Mutex.Lock()
	defer func() {
		hub.Mutex.Unlock()
	}()
	for client := range hub.Clients {
		go SendToClient(hub, client, *eventws)
	}
}

func SendToClient(hub *Hub, client *Client , ev model.WsEvent) {
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
	defer func() {
		hub.Mutex.Unlock()
	}()
	for client := range hub.Clients {
		if(client.ID == eventws.TargetID) {
			go SendToClient(hub,client, *eventws )
		}
	}
}
