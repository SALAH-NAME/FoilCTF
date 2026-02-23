package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
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

func jwtMiddleware(next http.Handler, secret string, requiredRole string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			log.Printf("[JWT] Error validating token: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && requiredRole != "" {
			if role, ok := claims["role"].(string); !ok || role != requiredRole {
				log.Printf("[JWT] Insufficient permissions: required %s, got %v", requiredRole, claims["role"])
				http.Error(w, "Forbidden: Insufficient permissions", http.StatusForbidden)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

func registerRoute(r chi.Router, route RouteConfig, proxy *httputil.ReverseProxy, secret string) {
	r.Route(route.Prefix, func(r chi.Router) {
		var handler http.Handler = proxy
		if route.Protected {
			if route.RequiredRole != "" {
				log.Printf("  [ROUTE] %s - Protected (Required Role: %s)", route.Prefix, route.RequiredRole)
			} else {
				log.Printf("  [ROUTE] %s - Protected", route.Prefix)
			}
			handler = jwtMiddleware(handler, secret, route.RequiredRole)
		}

		if route.StripPrefix {
			handler = http.StripPrefix(route.Prefix, handler)
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

func registerAllServices(r chi.Router, registry []ServiceConfig, secret string) error {
	for _, svc := range registry {
		log.Printf("[SERVICE] Configuring '%s' -> %s", svc.Name, svc.BaseURL)

		proxy, err := createReverseProxy(svc.BaseURL, svc.Name)
		if err != nil {
			return err
		}

		for _, route := range svc.Routes {
			registerRoute(r, route, proxy, secret)
		}
	}

	log.Printf("[GATEWAY] Successfuly registered %d services", len(registry))
	return nil
}
