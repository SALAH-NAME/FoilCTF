package config

import (
	"os"
	"time"
)


type Config struct {
	GlobalBuffer     	int
	ClientBuffer     	int
	RegisterBuffer   	int
	BroadcastTimeout	time.Duration
}

func NewDefaultConfig() *Config {
	return &Config{
		GlobalBuffer:     50,
		ClientBuffer:     100,
		RegisterBuffer:   20,
		BroadcastTimeout: 5 * time.Second,
	}
}

func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
