package main

import (
	"fmt"
	"log"
	"net/http"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dbHost 	 := getEnv("DB_HOST", "localhost")
	dbUser 	 := getEnv("DB_USER", "postgres")
	dbPass 	 := getEnv("DB_PASS", "pass12345678")
	dbName 	 := getEnv("DB_NAME", "foil_ctf")
	dbPort	 := getEnv("DB_PORT", "5432")
	chatPort := getEnv("PORT", "3003")

	dns := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPass, dbName, dbPort)
	db, error := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if error != nil {
		log.Fatalf("DATABASE ERROR: Failed to connect to database: %s", error)
	}
	sqlDB, err := db.DB();
	if err != nil {
		log.Fatalf("DATABASE ERROR: Failed to get the generic database object: %v", err)
	}
	
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("DATABASE ERROR: Database is not reachable: %s", err)
	}
	log.Println("Successfully connected to PostgreSQL!")
	conf := NewDefaultConfig()
	hubChannel := NewHub(db, &conf)
	go hubChannel.TrackChannels()

	http.HandleFunc("/api/chat", hubChannel.ServeChat)
	http.HandleFunc("/api/chat/users", hubChannel.ServeGetUsers)
	http.HandleFunc("/api/chat/messages", hubChannel.ServeChatHistory)
	log.Printf("Server starting at port %s !", chatPort)
	
	if err := http.ListenAndServe(":" + chatPort, nil) ; err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v" , err)
	}
}
