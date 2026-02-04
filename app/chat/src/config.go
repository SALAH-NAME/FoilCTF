package main

import (
	"os"
	"time"
)

type Config struct {
	MaxContentLimit  int
	GlobalBuffer     int
	ClientBuffer     int
	RegisterBuffer   int
	RateLimitRequest float64
	RateLimitBrust   int
	EditLimit        time.Duration
	BroadcastTimeout time.Duration
	JWTSecret        []byte
}

func NewDefaultConfig() Config {
	jwtKey := GetEnv("SECRET_KEY", "")
	return Config{
		MaxContentLimit:  500,
		GlobalBuffer:     100,
		ClientBuffer:     200,
		RegisterBuffer:   20,
		RateLimitRequest: 3,
		RateLimitBrust:   6,
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
