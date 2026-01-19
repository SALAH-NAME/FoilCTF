package main

import (
	"os"
	"time"
)

type config struct {
	MaxContentLimit  	int
	GlobalBuffer     	int
	ClientBuffer     	int
	RegisterBuffer   	int
	RateLimitRequest 	float64
	RateLimitBrust   	int
	EditLimit        	time.Duration
	BroadcastTimeout	time.Duration
}

func NewDefaultConfig() config {
	return config{
		MaxContentLimit:  500,
		GlobalBuffer:     100,
		ClientBuffer:     200,
		RegisterBuffer:   20,
		RateLimitRequest: 3,
		RateLimitBrust:   6,
		EditLimit:        1 * time.Minute,
		BroadcastTimeout: 5 * time.Second,
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
