package main

import (
	"log"
	"os"
	"time"
)

type Config struct {
	MaxContentLimit  int
	GlobalBuffer     int
	ClientBuffer     int
	RegisterBuffer   int
	RateLimitRequest float64
	RateLimitBurst   int
	EditLimit        time.Duration
	BroadcastTimeout time.Duration
	JWTSecret        []byte
}

func NewDefaultConfig() Config {
	jwtKey := GetEnv("ACCESS_TOKEN_SECRET", "")
	if jwtKey == "" {
		log.Fatal("FATAL: ENVIRONMENT: ACCESS_TOKEN_SECRET is required")
	}
	return Config{
		MaxContentLimit:  500,
		GlobalBuffer:     100,
		ClientBuffer:     200,
		RegisterBuffer:   20,
		RateLimitRequest: 3,
		RateLimitBurst:   6,
		EditLimit:        1 * time.Minute,
		BroadcastTimeout: 1 * time.Second,
		JWTSecret:        []byte(jwtKey),
	}
}

func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
