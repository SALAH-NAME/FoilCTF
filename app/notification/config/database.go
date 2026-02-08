package config

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
)

func DbInit() (*gorm.DB, error) {
	dbHost := GetEnv("DB_HOST", "localhost")
	dbUser := GetEnv("DB_USER", "postgres")
	dbPass := GetEnv("DB_PASS", "postgres")
	dbName := GetEnv("DB_NAME", "foilctf")
	dbPort := GetEnv("DB_PORT", "5432")

	dns := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPass, dbName, dbPort)
	db, err := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("Failed to connect to database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("Failed to get the generic database object: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("Database is not reachable: %v", err)
	}
	log.Println("Successfully connected to PostgreSQL!")
	return db, nil
}
