package main

import (
	"fmt"
	"net/http"
)

func main() {
	hubChannel := NewHub()
	go hubChannel.Run()
	http.HandleFunc("/ws", hubChannel.serveChat)
	http.HandleFunc("/ws/api/users", hubChannel.serveGetUsers)
	fmt.Println("server starting at port 9091")
	err := http.ListenAndServe(":9091", nil)
	if err != nil {
		panic("error starting the server")
	}
}