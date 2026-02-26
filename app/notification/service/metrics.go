package service

import (
	"bufio"
	"io"
	"net"
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

type responseWriterStatusful struct {
	http.ResponseWriter

	Status int
	wroteHeader bool
}
func (w *responseWriterStatusful) WriteHeader(statusCode int) {
	if w.wroteHeader {
		return
	}

	w.ResponseWriter.WriteHeader(statusCode)
	w.Status = statusCode
	w.wroteHeader = true
}
func (w *responseWriterStatusful) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.WriteHeader(w.Status)
		w.wroteHeader = true
	}
	return w.ResponseWriter.Write(b)
}
func (w *responseWriterStatusful) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}
func (w *responseWriterStatusful) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hijacker, ok := w.ResponseWriter.(http.Hijacker); ok {
		return hijacker.Hijack()
	}
	return nil, nil, http.ErrNotSupported
}
func (w *responseWriterStatusful) Push(target string, opts *http.PushOptions) error {
	if pusher, ok := w.ResponseWriter.(http.Pusher); ok {
		return pusher.Push(target, opts)
	}
	return http.ErrNotSupported
}
func (w *responseWriterStatusful) ReadFrom(src io.Reader) (int64, error) {
	if readerFrom, ok := w.ResponseWriter.(io.ReaderFrom); ok {
		if !w.wroteHeader {
			w.WriteHeader(http.StatusOK)
		}
		return readerFrom.ReadFrom(src)
	}
	return io.Copy(w.ResponseWriter, src)
}

func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/metrics" || r.URL.Path == "/health" {
			next.ServeHTTP(w, r)
			return
		}

		wStatus := responseWriterStatusful{ w, http.StatusOK, false }

		start := time.Now()
		next.ServeHTTP(&wStatus, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(wStatus.Status)

		httpRequestsTotal.WithLabelValues(r.Method, status).Inc()
		httpRequestDuration.WithLabelValues(r.Method, status).Observe(duration)
	})
}

func MetricsHandler() http.Handler {
	return promhttp.Handler()
}
