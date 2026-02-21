package main

type Config struct {
	Port        string
	ServiceName string
	LogLevel    string // debug, info, warn, error
	CertDir     string
}

func LoadConfig() *Config {
	return &Config{
		Port:        getEnv("PORT", "443"),
		ServiceName: getEnv("SERVICE_NAME", "gateway"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		CertDir:     getEnv("CERT_DIR", "/certs"),
	}
}
