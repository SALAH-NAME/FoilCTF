package main

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
	userIDKey   contextKey = "userID"
	usernameKey contextKey = "username"
	userRoleKey contextKey = "userRole"
	// teamIDKey 		contextKey = "teamID"
	// eventIDKey		contextKey = "eventID"
)

type Claims struct {
	UserID   string `json:"userid"`
	Username string `json:"username"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func (h *Hub) VerifySigningMethod(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, fmt.Errorf("Unexpected signing method : %v", token.Header["alg"])
	}
	return h.Conf.JWTSecret, nil
}

func (h *Hub) IdentityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := Claims{}
		token, err := jwt.ParseWithClaims(tokenString, &claims, h.VerifySigningMethod)
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

func (h *Hub) PlayerAuthMiddleware(next http.Handler) http.Handler {
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
		eventID, err := h.ReadIntParam(r, "id")
		if err != nil {
			log.Printf("Invalid eventID: %v", err)
			JSONError(w, "Invalid eventID", http.StatusBadRequest)
			return
		}
		event := Ctf{}
		err = h.Db.Table("ctfs").Find(&event, eventID).Error
		if err != nil {
			log.Printf("event not found: %v", err)
			JSONError(w, "Event Not Found", http.StatusBadRequest)
			return
		}
		if event.Status != "active" {
			JSONError(w, "Not allowed to access event", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Hub) EnsureEventAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: Valid authentication required %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		eventID, err := h.ReadIntParam(r, "id")
		if err != nil {
			log.Printf("Invalid eventID: %v", err)
			JSONError(w, "Invalid eventID", http.StatusBadRequest)
			return
		}
		var part Participation
		teamID, err := h.GetTeamIDByUserID(userID)
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Team membership required", http.StatusForbidden)
			return
		}
		err = h.Db.Where("ctf_id = ? AND team_id = ?", eventID, teamID).
			First(&part).Error
		if err != nil {
			log.Printf("Database Error: %v", err)
			JSONError(w, "Event Registration reqiired", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Hub) OrganizerAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: Valid authentication required %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "organizer" && userRole != "admin" {
			log.Printf("Forbidden: role %s is not authorized for admin routeh.", userRole)
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Hub) EnsureEventOwnership(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("Unauthorized: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "admin" {
			eventID, err := h.ReadIntParam(r, "id")
			if err != nil {
				log.Printf("Bad request: Invalid eventID. for user: %s", userID)
				JSONError(w, "Bad request: Invalid eventID.", http.StatusBadRequest)
				return
			}
			var count int64
			err = h.Db.Table("ctf_organizers").
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
