package main

import "strconv"

type Config struct {
	Port              string
	ServiceName       string
	LogLevel          string // debug, info, warn, error
	CertDir           string
	AccessTokenSecret string
	RateLimitEnabled  bool
	RateLimitRPS      float64 // requests per second per IP
	RateLimitBurst    int     // burst size (max spike) per IP
}

func LoadConfig() *Config {
	rps, err := strconv.ParseFloat(getEnv("RATE_LIMIT_RPS", "60"), 64)
	if err != nil {
		rps = 60
	}
	burst, err := strconv.Atoi(getEnv("RATE_LIMIT_BURST", "50"))
	if err != nil {
		burst = 50
	}
	rateLimitEnabled := getEnv("RATE_LIMIT_ENABLED", "true") != "false"

	return &Config{
		Port:              getEnv("PORT", "443"),
		ServiceName:       getEnv("SERVICE_NAME", "gateway"),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		CertDir:           getEnv("CERT_DIR", "/certs"),
		AccessTokenSecret: getEnv("ACCESS_TOKEN_SECRET", "changeme-secret-key"),
		RateLimitEnabled:  rateLimitEnabled,
		RateLimitRPS:      rps,
		RateLimitBurst:    burst,
	}
}
