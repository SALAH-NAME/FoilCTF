package config

import (
	"net/http"
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

func NewDefaultConfig() *Config {
	jwtKey := GetEnv("SECRET_KEY", "")
	return &Config{
		GlobalBuffer:     100,
		ClientBuffer:     100,
		RegisterBuffer:   20,
		BroadcastTimeout: 2 * time.Second,
		JWTSecret:        []byte(jwtKey),
	}
}

func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func NewServer(router http.Handler) (*http.Server, string) {
	port := GetEnv("PORT", "3004")

	return &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}, port
}
