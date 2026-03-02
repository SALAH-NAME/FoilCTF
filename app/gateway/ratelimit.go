package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"golang.org/x/time/rate"
)

var rateLimitedTotal = promauto.NewCounter(
	prometheus.CounterOpts{
		Name: "gateway_rate_limited_requests_total",
		Help: "Total number of requests rejected due to rate limiting.",
	},
)

type ipLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type rateLimiterStore struct {
	mu       sync.RWMutex
	visitors map[string]*ipLimiterEntry
	rps      rate.Limit
	burst    int
}

func newRateLimiterStore(rps float64, burst int) *rateLimiterStore {
	store := &rateLimiterStore{
		visitors: make(map[string]*ipLimiterEntry),
		rps:      rate.Limit(rps),
		burst:    burst,
	}
	go store.cleanupLoop()
	return store
}

func (s *rateLimiterStore) getOrCreate(ip string) *rate.Limiter {
	s.mu.RLock()
	entry, exists := s.visitors[ip]
	s.mu.RUnlock()

	if exists {
		s.mu.Lock()
		entry.lastSeen = time.Now()
		s.mu.Unlock()
		return entry.limiter
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if entry, exists = s.visitors[ip]; exists {
		entry.lastSeen = time.Now()
		return entry.limiter
	}

	lim := rate.NewLimiter(s.rps, s.burst)
	s.visitors[ip] = &ipLimiterEntry{limiter: lim, lastSeen: time.Now()}
	return lim
}

func (s *rateLimiterStore) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		threshold := time.Now().Add(-10 * time.Minute)
		s.mu.Lock()
		for ip, entry := range s.visitors {
			if entry.lastSeen.Before(threshold) {
				delete(s.visitors, ip)
			}
		}
		remaining := len(s.visitors)
		s.mu.Unlock()

		log.Printf("[RATELIMIT] Cleaned up stale IP entries, active limiters: %d", remaining)
	}
}

func rateLimitMiddleware(store *rateLimiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/metrics" || r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
				return
			}

			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}

			if !store.getOrCreate(ip).Allow() {
				log.Printf("[RATELIMIT] Rate limit exceeded for IP: %s %s %s", ip, r.Method, r.URL.Path)
				rateLimitedTotal.Inc()

				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "1")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]string{
					"error":   "rate_limit_exceeded",
					"message": "Too many requests, please slow down",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
