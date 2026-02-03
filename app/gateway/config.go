package main

type Config struct {
	Port        string
	ServiceName string
	LogLevel    string // debug, info, warn, error
}

func LoadConfig() *Config {
	return &Config{
		Port:        getEnv("PORT", "3000"),
		ServiceName: getEnv("SERVICE_NAME", "gateway"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}
}
