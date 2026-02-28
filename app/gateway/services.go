package main

import "os"

type ServiceConfig struct {
	Name    string
	BaseURL string
	Routes  []RouteConfig
}

type RouteConfig struct {
	Prefix       string
	Protected    bool   // is requires JWT authentication
	RequiredRole string // optional required role (e.g. "admin")
	WebSocket    bool   // if it supports WebSocket upgrades
	StripPrefix  bool   // if true, remove the prefix when forwarding
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
		BaseURL: getEnv("GATEWAY_USER_URL", "http://user:3001"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/auth",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/oauth",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/profiles",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/teams",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/friends",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/users",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/requests",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "challenge",
		BaseURL: getEnv("GATEWAY_CHALLENGE_URL", "http://challenge:3002"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/challenges",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/hints",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
			{
				Prefix:      "/api/submissions",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "chat",
		BaseURL: getEnv("GATEWAY_CHAT_URL", "http://chat:3003"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/chat",
				Protected:   false,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "notification",
		BaseURL: getEnv("GATEWAY_NOTIFICATION_URL", "http://notification:3004"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/notifications",
				Protected:   false,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "event",
		BaseURL: getEnv("GATEWAY_EVENT_URL", "http://event:3005"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/event",
				Protected:   false,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "sandbox",
		BaseURL: getEnv("GATEWAY_SANDBOX_URL", "http://sandbox:8080"),
		Routes: []RouteConfig{
			{
				Prefix:      "/api/sandbox",
				Protected:   false,
				WebSocket:   false,
				StripPrefix: false,
			},
		},
	},

	{
		Name:    "prometheus",
		BaseURL: getEnv("GATEWAY_PROMETHEUS_URL", "http://prometheus:9090"),
		Routes: []RouteConfig{
			{
				Prefix:       "/monitoring/prometheus",
				Protected:    false,
				RequiredRole: "",
				WebSocket:    false,
				StripPrefix:  false,
			},
		},
	},

	{
		Name:    "grafana",
		BaseURL: getEnv("GATEWAY_GRAFANA_URL", "http://grafana:9091"),
		Routes: []RouteConfig{
			{
				Prefix:       "/monitoring/grafana",
				Protected:    false,
				RequiredRole: "",
				WebSocket:    true,
				StripPrefix:  false,
			},
		},
	},
	{
		Name:    "web",
		BaseURL: getEnv("GATEWAY_WEB_URL", "http://web:3000"),
		Routes: []RouteConfig{
			{
				Prefix:      "/",
				Protected:   false,
				WebSocket:   true,
				StripPrefix: false,
			},
		},
	},
}
