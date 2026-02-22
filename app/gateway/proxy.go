package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func createReverseProxy(targetURL, serviceName string) (*httputil.ReverseProxy, error) {
	target, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
		log.Printf("[PROXY:%s] %s %s -> %s", serviceName, req.Method, req.URL.Path, target.Host)
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("[PROXY:%s] Error proxying request to %s: %v", serviceName, r.URL.Path, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		response := map[string]string{
			"error":   "service_unavailable",
			"message": "The requested service is currently unavailable",
			"service": serviceName,
		}
		json.NewEncoder(w).Encode(response)
	}
	return proxy, nil
}

func isWebSocketUpgrade(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Upgrade"), "websocket")
}

func wsAwareHandler(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if isWebSocketUpgrade(r) {
			rc := http.NewResponseController(w)
			_ = rc.SetWriteDeadline(time.Time{})
			_ = rc.SetReadDeadline(time.Time{})
		}
		next.ServeHTTP(w, r)
	}
}

func registerRoute(r chi.Router, route RouteConfig, proxy *httputil.ReverseProxy) {
	r.Route(route.Prefix, func(r chi.Router) {
		// TODO: Add JWT middleware
		if route.Protected {
			log.Printf("  [ROUTE] %s - Protected", route.Prefix)
		}

		var handler http.Handler = proxy
		if route.StripPrefix {
			handler = http.StripPrefix(route.Prefix, proxy)
		}
		if route.WebSocket {
			log.Printf("  [ROUTE] %s - WebSocket enabled", route.Prefix)
			r.HandleFunc("/*", wsAwareHandler(handler))
		} else {
			r.HandleFunc("/*", handler.ServeHTTP)
		}

		log.Printf("  [ROUTE] Registered %s -> backend", route.Prefix)
	})
}

func registerAllServices(r chi.Router, registry []ServiceConfig) error {
	for _, svc := range registry {
		log.Printf("[SERVICE] Configuring '%s' -> %s", svc.Name, svc.BaseURL)

		proxy, err := createReverseProxy(svc.BaseURL, svc.Name)
		if err != nil {
			return err
		}

		for _, route := range svc.Routes {
			registerRoute(r, route, proxy)
		}
	}

	log.Printf("[GATEWAY] Successfuly registered %d services", len(registry))
	return nil
}
