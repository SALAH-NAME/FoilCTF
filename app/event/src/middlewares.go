package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type contextKey string

const (
	userIDKey   contextKey = "userID"
	usernameKey contextKey = "username"
	userRoleKey contextKey = "userRole"
	eventKey    contextKey = "event"
	teamIDKey   contextKey = "teamID"
)

type Claims struct {
	UserID   *int   `json:"userid"`
	Username string `json:"username"`
	UserRole string `json:"role"`
	jwt.RegisteredClaims
}

func (h *Hub) VerifySigningMethod(token *jwt.Token) (any, error) {
	if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
		return nil, fmt.Errorf("Unexpected signing method : %v", token.Header["alg"])
	}
	return h.Conf.JWTSecret, nil
}

func (h *Hub) IdentityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			next.ServeHTTP(w, r)
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims := Claims{}
		token, err := jwt.ParseWithClaims(tokenString, &claims, h.VerifySigningMethod)
		if err != nil || !token.Valid {
			log.Printf("DEBUG - Identity - Invalid or expired token, proceeding as guest: %v", err)
			next.ServeHTTP(w, r)

			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		ctx = context.WithValue(ctx, usernameKey, claims.Username)
		ctx = context.WithValue(ctx, userRoleKey, claims.UserRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Hub) EnsureEventExists(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		eventID, err := h.ReadIntParam(r, "id")
		if err != nil {
			log.Printf("ERROR - Invalid request path format event id: %v", err)
			JSONError(w, "Invalid eventID", http.StatusBadRequest)

			return
		}

		ctxBg := context.Background()
		event, err := gorm.G[Ctf](h.Db).Where("id = ?", eventID).First(ctxBg)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				JSONError(w, "Event not found", http.StatusNotFound)
			} else {
				log.Printf("DEBUG - Database - Could not query event: %v", err)
				JSONError(w, "Could not ensure the event's existence", http.StatusInternalServerError)
			}
			return
		}

		ctx := context.WithValue(r.Context(), eventKey, event)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Hub) PlayerAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("ERROR - Auth - Unauthorized player: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "user" {
			log.Printf("ERROR - Auth - Unauthorized player role %q", userRole)
			JSONError(w, "Forbidden", http.StatusForbidden)
			return
		}

		eventID, err := h.ReadIntParam(r, "id")
		if err != nil {
			log.Printf("ERROR - Auth - Invalid event id: %v", err)
			JSONError(w, "Invalid eventID", http.StatusBadRequest)
			return
		}

		ctxBg := context.Background()
		event, err := gorm.G[Ctf](h.Db).Where("id = ?", eventID).First(ctxBg)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				JSONError(w, "Event not found", http.StatusNotFound)
			} else {
				log.Printf("ERROR - Auth - Could not query event: %v", err)
				JSONError(w, "Could not ensure the event's existence", http.StatusInternalServerError)
			}
			return
		}
		if event.Status != "active" && event.Status != "published" {
			JSONError(w, "Not allowed to access event", http.StatusForbidden)
			return
		}

		var count int64
		err = h.Db.Table("ctfs_challenges").
			Where("ctf_id = ?", event.ID).
			Count(&count).Error
		if err != nil {
			log.Printf("ERROR - Auth - Could not query event challenges count: %v", err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if count == 0 {
			log.Printf("ERROR - Auth - User %v can't access an active event without challenges", *userID)
			JSONError(w, "Cannot join event witout challenges", http.StatusConflict)
			return
		}

		teamID, err := h.GetTeamIDByUserID(*userID)
		if err != nil {
			log.Printf("ERROR - Auth - Could not get team id by user id: %v", err)
			JSONError(w, "Team membership required", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), eventKey, event)
		ctx = context.WithValue(r.Context(), teamIDKey, teamID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Hub) EnsureEventAccess(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _, err := GetUserInfo(r)
		if err != nil {
			log.Printf("DEBUG - Unauthorized: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		event, ok := r.Context().Value(eventKey).(Ctf)
		if !ok {
			log.Printf("ERROR - Could not get event from the request context")
			JSONError(w, "Event not found", http.StatusInternalServerError)
			return
		}
		if event.Status != "active" {
			JSONError(w, "Not allowed to access event", http.StatusForbidden)
			return
		}

		teamID, ok := r.Context().Value(teamIDKey).(int)
		if !ok {
			log.Printf("ERROR - Could not get team id for user %v from the request context", *userID)
			JSONError(w, "Team not found", http.StatusInternalServerError)
			return
		}

		ctxBg := context.Background()
		if _, err = gorm.G[Participation](h.Db).Where("ctf_id = ? AND team_id = ?", event.ID, teamID).First(ctxBg); err != nil {
			log.Printf("ERROR - DATABASE - Could not query team ctf participation due to: %v", err)
			JSONError(w, "Event Registration required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *Hub) OrganizerAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userRole, err := GetUserInfo(r)
		if err != nil {
			log.Printf("DEBUG - Unauthorized: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if userRole != "organizer" && userRole != "admin" {
			log.Printf("DEBUG - Unauthorized: role %q is not authorized to access the admin routes", userRole)
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
			log.Printf("DEBUG - Unauthorized: %v", err)
			JSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		event := Ctf{}
		eventID, err := h.ReadIntParam(r, "id")
		if err != nil {
			log.Printf("DEBUG - Invalid request eventID format: %v", err)
			JSONError(w, "Bad request: Invalid eventID.", http.StatusBadRequest)
			return
		}

		if err := h.Db.Table("ctfs").Find(&event, eventID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("DEBUG - Event %d does not exist", eventID)
				JSONError(w, "Event Not Found", http.StatusNotFound)
			} else {
				log.Printf("ERROR - DATABASE - Could not query event %d due to: %v", eventID, err)
				JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			}
			return
		}

		if isOwner, err := h.IsOwner(eventID, *userID); err != nil {
			log.Printf("ERROR - DATABASE - Could not check event %d ownership due to: %v", eventID, err)
			JSONError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		} else if !isOwner && userRole != "admin" {
			log.Printf("DEBUG - User %d has no ownership over event %d", *userID, eventID)
			JSONError(w, "Missing Ownership", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), eventKey, event)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Hub) IsOwner(eventID, organizerID int) (bool, error) {
	var count int64

	err := h.Db.Table("ctf_organizers").
		Where("ctf_id = ? AND organizer_id = ?", eventID, organizerID).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}
	if count == 0 {
		return false, nil
	}
	return true, nil
}
