package main

import "os"

type ServiceConfig struct {
	Name    string
	BaseURL string
	Routes  []RouteConfig
}

type RouteConfig struct {
	Prefix      string
	Protected   bool // is requires JWT authentication
	WebSocket   bool // if it supports WebSocket upgrades
	StripPrefix bool // if true, remove the prefix when forwarding
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

var ServiceRegistry = []ServiceConfig{
	{
		Name:    "user",
		BaseURL: getEnv("SERVICE_USER_URL", "http://user:3001"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/auth",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/profiles",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/teams",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/friends",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/users",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "challenge",
		BaseURL: getEnv("SERVICE_CHALLENGE_URL", "http://challenge:3002"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/challenges",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/hints",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/submissions",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "chat",
		BaseURL: getEnv("SERVICE_CHAT_URL", "http://chat:3003"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/chat",
				Protected:   true,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "notification",
		BaseURL: getEnv("SERVICE_NOTIFICATION_URL", "http://notification:3004"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/notifications",
				Protected:   true,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "scoreboard",
		BaseURL: getEnv("SERVICE_SCOREBOARD_URL", "http://scoreboard:3005"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/scoreboard",
				Protected:   false,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "sandbox",
		BaseURL: getEnv("SERVICE_SANDBOX_URL", "http://sandbox:8080"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/sandbox",
				Protected:   true,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},
}
