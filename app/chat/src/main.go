package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func main() {
	//for dev
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASS", "pass12345678")
	dbName := getEnv("DB_NAME", "foil_ctf")
	dbPort := getEnv("DB_PORT", "5432")
	dns := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPass, dbName, dbPort)
	db, error := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if error != nil {
		log.Fatalf("Error connectiong to database: %s", error)
	}
	sqlDB, _ := db.DB()
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Database is not reachable: %s", err)
	}
	fmt.Println("Successfully connected to PostgreSQL!")

	hubChannel := NewHub(db)
	go hubChannel.TrackChannels()

	http.HandleFunc("/api/chat", hubChannel.serveChat)
	http.HandleFunc("/api/users", hubChannel.serveGetUsers)
	http.HandleFunc("/api/chat/messages", hubChannel.serveChatHistory)
	log.Println("Server starting at port 3003 !")
	
	err := http.ListenAndServe(":3003", nil)
	if err != nil {
		panic("error starting the server")
	}
}
