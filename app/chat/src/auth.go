package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	userIDKey   contextKey = "userID"
	usernameKey contextKey = "username"
	userRoleKey contextKey = "userRole"
)

type MyClaims struct {
	UserID   int64  `json:"id"`
	Username string `json:"username"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func (hub *Hub) VerifySigningMethod(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, fmt.Errorf("Unexpected signing method : %v", token.Header["alg"])
	}
	return hub.Conf.JWTSecret, nil
}

func (hub *Hub) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("DEBUG: SERVER: Authorization header required")
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims := &MyClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, hub.VerifySigningMethod)
		if err != nil {
			log.Printf("ERROR: SERVER: Failed to verify JWT token: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if !token.Valid {
			log.Printf("DEBUG: SERVER: Invalid JWT token: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if claims.UserID == 0 || claims.Username == "" {
			log.Printf("DEBUG: SERVER: Missing either UserID or Username")
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, strconv.FormatInt(claims.UserID, 10))
		ctx = context.WithValue(ctx, usernameKey, claims.Username)
		ctx = context.WithValue(ctx, userRoleKey, claims.UserRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
