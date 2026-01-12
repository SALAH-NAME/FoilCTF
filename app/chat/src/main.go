package main

import (
	"fmt"
	"time"
	"sync"
)

type Hub struct {
	MessageChannel chan Message
	register chan string
	unregister chan string
	clients map[string]bool
	wg sync.WaitGroup
}

type Message struct {
	Name string
	Content string
	SentTime time.Time
}

func (h *Hub) Run() {

	for {
		select {
			case mes1, ok := <- h.MessageChannel:
			{
				if !ok {
					fmt.Print("finished")
					return;
				}
				fmt.Println((mes1))
			}
			case mes2 := <- h.register:
			{
				h.clients[mes2] = true
				fmt.Println("hello ", mes2)
			}
			case mes3 := <- h.unregister:
			{
				delete(h.clients, mes3)
				fmt.Println("goodbye", mes3)
			}
		}

	}

}

func (h *Hub) Broadcast(name , text string) {
	toSend := Message {
		Name :name,
		Content: text,
		SentTime: time.Now(),
	}
	h.MessageChannel <- toSend
}

func (h *Hub) WaitForWorkers() {
	h.wg.Wait()
	close(h.MessageChannel)
	close(h.register)
	close(h.unregister)
}

func user(name string, h *Hub) {
	h.Join(name)
	defer h.wg.Done()
	for range 4 {
		h.Broadcast(name, "content")
		time.Sleep(1 * time.Second)
	}
	h.Leave((name))

}

func (h *Hub) Join(name string) {
	h.register <- name
}

func (h *Hub) Leave(name string) {
	h.unregister <- name
}

func NewHub() Hub {
	return Hub {
		MessageChannel: make(chan Message),
		register: make(chan string, 10),
		unregister: make(chan string, 10),
		clients: make(map[string]bool),
	}
}

func main() {
	hubChannel := NewHub()

	users := []string {"user1", "user2", "user3"}
	for _, name := range users {
		hubChannel.wg.Add(1)
		go user(name , &hubChannel)
	}
	go hubChannel.WaitForWorkers()
	hubChannel.Run()
}