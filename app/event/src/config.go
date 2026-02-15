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
	jwtKey := GetEnv("SECRET_KEY", "NTNv7j0TuYARvmNMmWXo6fKvM4o6nv/aUi9ryX38ZH+L1bkrnD1ObOQ8JAUmHCBq7Iy7otZcyAagBLHVKvvYaIpmMuxmARQ97jUVG16Jkpkp1wXOPsrF9zwew6TpczyHkHgX5EuLg2MeBuiT/qJACs1J0apruOOJCg/gOtkjB4c=")
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
