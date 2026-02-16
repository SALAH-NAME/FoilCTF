package main

import (
	"os"
	"time"
)

type Config struct {
	GlobalBuffer     int
	ClientBuffer     int
	RegisterBuffer   int
	BroadcastTimeout time.Duration
	JWTSecret        []byte
}

func NewConfig() Config {
	jwtKey := GetEnv("SECRET_KEY", "")
	return Config{
		GlobalBuffer:     100,
		ClientBuffer:     100,
		RegisterBuffer:   20,
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
