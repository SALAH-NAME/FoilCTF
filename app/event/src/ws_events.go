package main

import (
	"log"
	"time"
)

func (h *Hub) HandleJoin(client *Client) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	h.Clients[client] = true
	log.Printf("INFO: userID: %v has joined the server", client.LogId())
}

func (h *Hub) HandleUnjoin(client *Client) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	if _, exists := h.Clients[client]; !exists {
		return
	}
	delete(h.Clients, client)
	client.Connection.Close()
	close(client.Send)
	log.Printf("INFO: userID: %v has left the server", client.LogId())
}

func (h *Hub) HandleWsEvent(eventws *WsEvent) {
	switch eventws.Event {
	case "init":
	case "update":
		h.BroadcastData(eventws)
	default:
		log.Printf("ERROR: Unknown event type received %s", eventws.Event)
	}
}

func (h *Hub) BroadcastData(eventws *WsEvent) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	for client := range h.Clients {
		if client.EventID == eventws.EventID {
			go h.SendToClient(client, *eventws)
		}
	}
}

func (h *Hub) SendToClient(client *Client, event WsEvent) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ERROR: Panic in SendToClient for user %v: %v", client.LogId(), r)
			h.UnregisterChan <- client
		}
	}()
	select {
	case client.Send <- event:
	case <-time.After(h.Conf.BroadcastTimeout):
		{
			log.Printf("userid %v timed out, disconnecting", client.LogId())
			h.UnregisterChan <- client
		}
	}
}

func (h *Hub) ChannelsMonitoring() {
	for {
		select {
		case eventws, ok := <-h.GlobalChan:
			{
				if !ok {
					log.Print("Global event channel closed")
					return
				}
				h.HandleWsEvent(&eventws)
			}
		case client, ok := <-h.RegisterChan:
			{
				if !ok {
					log.Print("Register channel closed")
					return
				}
				h.HandleJoin(client)
			}
		case client, ok := <-h.UnregisterChan:
			{
				if !ok {
					log.Print("Unegister channel closed")
					return
				}
				h.HandleUnjoin(client)
			}
		}

	}
}
