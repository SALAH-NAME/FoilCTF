package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// TODO: Check backend services
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

func main() {
	config := LoadConfig()
	log.Printf("[%s] Starting API Gateway", config.ServiceName)
	log.Printf("[%s] Listening on port %s", config.ServiceName, config.Port)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Get("/health", healthHandler)

	if err := registerAllServices(r, ServiceRegistry); err != nil {
		log.Fatalf("[%s] Failed to register services: %v", config.ServiceName, err)
	}

	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[%s] Gateway is ready to handle requests on : %s", config.ServiceName, config.Port)
		log.Printf("[%s] Registered routes:", config.ServiceName)
		for _, svc := range ServiceRegistry {
			for _, route := range svc.Routes {
				log.Printf("  %s -> %s", route.Prefix, svc.Name)
			}
		}

		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("[%s] Server error: %v", config.ServiceName, err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Printf("[%s] Shutdown signal received, closing connections...", config.ServiceName)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[%s] Shutdown error: %v", config.ServiceName, err)
	}
	log.Printf("[%s] Gateway stopped cleanly", config.ServiceName)
}
