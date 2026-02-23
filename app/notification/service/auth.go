package service

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	userIDKey   contextKey = "contextKeyUserId"
	userRoleKey contextKey = "contextKeyUserRole"
)

type FoilClaims struct {
	UserID   *int `json:"id"`
	UserName string `json:"username"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func (hub *Hub) VerifySigningMethod(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, fmt.Errorf("Unexpected signing method : %v", token.Header["alg"]) // Header -> map[string]interface{} alg, typ etc
	}
	return hub.Conf.JWTSecret, nil
}

func (hub *Hub) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			query := r.URL.Query()
			tokenString = query.Get("token")
			if tokenString == "" {
				log.Printf("Authorization header required")
				JSONError(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}

		claims := &FoilClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, hub.VerifySigningMethod)
		if err != nil {
			log.Printf("Failed to verify JWT token: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		} else if !token.Valid {
			log.Printf("Invalid JWT token: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if claims.UserID == nil {
			log.Printf("Unauthorized: UserId required")
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, *claims.UserID)
		ctx = context.WithValue(ctx, userRoleKey, claims.UserRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
