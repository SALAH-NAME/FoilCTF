package main

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
)

func DbInit() *gorm.DB {
	dbHost := GetEnv("DB_HOST", "localhost")
	dbUser := GetEnv("DB_USER", "postgres")
	dbPass := GetEnv("DB_PASS", "postgres")
	dbName := GetEnv("DB_NAME", "foilctf")
	dbPort := GetEnv("DB_PORT", "5432")

	dns := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPass, dbName, dbPort)
	db, error := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if error != nil {
		log.Fatalf("DATABASE ERROR: Failed to connect to database: %s", error)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("DATABASE ERROR: Failed to get the generic database object: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("DATABASE ERROR: Database is not reachable: %s", err)
	}
	log.Println("Successfully connected to PostgreSQL!")
	return db
}
