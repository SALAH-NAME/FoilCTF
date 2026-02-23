package service

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "notification_http_requests_total",
			Help: "Total number of HTTP requests processed, partitioned by status code and HTTP method.",
		},
		[]string{"method", "status"},
	)
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "notification_http_request_duration_seconds",
			Help:    "Histogram of response time for HTTP requests.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "status"},
	)
	WebsocketConnectedClients = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "notification_websocket_connected_clients",
			Help: "Total number of active WebSocket connections.",
		},
	)
	WebsocketMessagesTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "notification_websocket_messages_total",
			Help: "Total number of messages processed by the WebSocket hub.",
		},
	)
	WebsocketEventsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "notification_websocket_events_total",
			Help: "Total number of events processed by the WebSocket hub, partitioned by event type.",
		},
		[]string{"event"},
	)
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" || r.URL.Path == "/health" {
			next.ServeHTTP(w, r)
			return
		}

		start := time.Now()
		rw := &responseWriter{w, http.StatusOK}

		next.ServeHTTP(rw, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(rw.statusCode)

		httpRequestsTotal.WithLabelValues(r.Method, status).Inc()
		httpRequestDuration.WithLabelValues(r.Method, status).Observe(duration)
	})
}

func MetricsHandler() http.Handler {
	return promhttp.Handler()
}
