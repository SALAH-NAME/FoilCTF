package main

import (
	"fmt"
	"log"
	"net/http"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dns := "host=localhost user=postgres password=pass12345678 dbname=foil_ctf port=5432 sslmode=disable"
	db, error := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if error != nil {
		log.Fatalf("Error connectiong to database: %s", error)
	}
	sqlDB, _ := db.DB()
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Database is not reachable: %s", err)
	}
	fmt.Println("Successfully connected to postgres!")
	hubChannel := NewHub(db)
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