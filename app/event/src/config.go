package main

import (
	"os"
)

type Config struct {
	JWTSecret []byte
}

func NewDefaultConfig() Config {
	jwtKey := GetEnv("SECRET_KEY", "")
	return Config{
		JWTSecret: []byte(jwtKey),
	}
}
func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
