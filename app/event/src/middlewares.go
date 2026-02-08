package main

import (
	"context"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"log"
	"net/http"
	"strings"
)

type contextKey string

const (
	userIDKey   contextKey = "userID"
	usernameKey contextKey = "username"
	userRoleKey contextKey = "userRole"
)

type Claims struct {
	UserID   string `json:"userid"`
	Username string `json:"username"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func (s *Server) VerifySigningMethod(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, fmt.Errorf("Unexpected signing method : %v", token.Header["alg"])
	}
	return s.Conf.JWTSecret, nil
}

func (s *Server) IdentityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := Claims{}
		token, err := jwt.ParseWithClaims(tokenString, &claims, s.VerifySigningMethod)
		if err != nil || !token.Valid {
			log.Printf("Identity: Invalid or expired token (treating as guest): %v", err)
			next.ServeHTTP(w, r)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		ctx = context.WithValue(ctx, usernameKey, claims.Username)
		ctx = context.WithValue(ctx, userRoleKey, claims.UserRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserInfo(r *http.Request) (string, string, error) {
	userID, okID := r.Context().Value(userIDKey).(string)
	userRole, okRole := r.Context().Value(userRoleKey).(string)
	if !okID || !okRole || userID == "" || userRole == "" {
		return "", "", fmt.Errorf("User identity missing from the context")
	}
	return userID, userRole, nil
}

func (s *Server) PlayerAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: Valid authentication required %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "player" {
			log.Printf("Forbidden")
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) OrganizerAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: Valid authentication required %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "organizer" && userRole != "admin" {
			log.Printf("Forbidden: role %s is not authorized for admin routes.", userRole)
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) EnsureEventOwnership(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "admin" {
			eventID, err := s.ReadIntParam(r, "id")
			if err != nil {
				log.Printf("Bad request: Invalid eventID. for user: %s", userID)
				JSONError(w, "Bad request: Invalid eventID.", http.StatusBadRequest)
				return
			}
			var count int64
			err = s.Db.Table("ctf_organizers").
				Where("ctf_id = ? AND organizer_id = ?", eventID, userID).
				Count(&count).
				Error
			if err != nil || count == 0 {
				log.Printf("Forbidden: ownership check failed for user: %s, eventID: %d", userID, eventID)
				JSONError(w, "Forbidden: You do not manage this event.", http.StatusForbidden)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
