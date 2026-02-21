package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
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

func ensureCertificates(certDir string) error {
	certPath := filepath.Join(certDir, "tls.crt")
	keyPath := filepath.Join(certDir, "tls.key")

	if _, err := os.Stat(certPath); err == nil {
		if _, err := os.Stat(keyPath); err == nil {
			log.Printf("    [SSL] certificates already exist in %s", certDir)
			return nil
		}
	}

	log.Printf("Generating self-signed SSL certificates in %s", certDir)

	if err := os.MkdirAll(certDir, 0755); err != nil {
		return fmt.Errorf("failed to create cert directory: %v", err)
	}

	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return fmt.Errorf("failed to generate private key: %v", err)
	}

	notBefore := time.Now()
	notAfter := notBefore.Add(365 * 24 * time.Hour)

	serialNumber, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return fmt.Errorf("failed to generate serial number: %v", err)
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"FoilCTF Gateway"},
		},
		NotBefore:             notBefore,
		NotAfter:              notAfter,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		DNSNames:              []string{"localhost", "gateway"},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		return fmt.Errorf("failed to create certificate: %v", err)
	}

	certOut, err := os.Create(certPath)
	if err != nil {
		return fmt.Errorf("failed to open cert.pem for writing: %v", err)
	}
	defer certOut.Close()
	if err := pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		return fmt.Errorf("failed to write data to cert.pem: %v", err)
	}

	keyOut, err := os.OpenFile(keyPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return fmt.Errorf("failed to open key.pem for writing: %v", err)
	}
	defer keyOut.Close()
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return fmt.Errorf("unable to marshal private key: %v", err)
	}
	if err := pem.Encode(keyOut, &pem.Block{Type: "PRIVATE KEY", Bytes: privBytes}); err != nil {
		return fmt.Errorf("failed to write data to key.pem: %v", err)
	}

	log.Printf("Successfully generated certificates: %s, %s", certPath, keyPath)
	return nil
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

	if err := ensureCertificates(config.CertDir); err != nil {
		log.Fatalf("[%s] Failed to generate/load SSL certificates: %v", config.ServiceName, err)
	}

	go func() {
		log.Printf("[%s] Gateway is ready to handle requests on : %s (HTTPS)", config.ServiceName, config.Port)
		log.Printf("[%s] Registered routes:", config.ServiceName)
		for _, svc := range ServiceRegistry {
			for _, route := range svc.Routes {
				log.Printf("  %s -> %s", route.Prefix, svc.Name)
			}
		}

		if err := srv.ListenAndServeTLS(filepath.Join(config.CertDir, "tls.crt"), filepath.Join(config.CertDir, "tls.key")); err != http.ErrServerClosed {
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
