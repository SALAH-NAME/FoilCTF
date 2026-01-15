package main

import (
	"fmt"
	"net/http"
)

func main() {
	hubChannel := NewHub()
	go hubChannel.Run()
	http.HandleFunc("/api/chat", hubChannel.serveChat)
	http.HandleFunc("/api/users", hubChannel.serveGetUsers)
	http.HandleFunc("/api/chat/messages", hubChannel.serveChatHistory)
	fmt.Println("server starting at port 9091")
	err := http.ListenAndServe(":9091", nil)
	if err != nil {
		panic("error starting the server")
	}
}