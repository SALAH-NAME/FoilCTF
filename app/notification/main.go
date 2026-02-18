package main

import (
	"context"
	"encoding/json"
	"log"
	"strconv"
	"time"

	"kodaic.ma/notification/config"
	"kodaic.ma/notification/service"

	"github.com/lib/pq"
)

func main() {
	dbConf := config.NewDefaultConfig()

	db, err := config.DbInit()
	if err != nil {
		log.Fatalf("ERROR: DATABASE: %v", err)
	}

	hub := service.NewHub(db, dbConf)
	go hub.TrackChannels()

	ctxListener, cancelListener := context.WithCancel(context.Background())
	defer cancelListener()

	go func() {
		dsn := config.DbDsn()
		listener := pq.NewListener(dsn, 10*time.Second, 30*time.Second, func(event pq.ListenerEventType, err error) {
			if err != nil {
				log.Printf("ERROR: DATABASE: %v, %v", err, event)
			}
		})

		listenChannelName := "inbox_notifications"
		if err := listener.Listen(listenChannelName); err != nil {
			log.Printf("ERROR: DATABASE: Could not listen to %q: %v", listenChannelName, err)
			return
		}
		defer listener.Close()

		for {
			select {
			case n := <-listener.Notify:
				type Notification struct {
					Id          int       `json:"id" gorm:"column:id;primaryKey"`
					IsPublished bool      `json:"-" gorm:"column:is_published;default:false`
					CreatedAt   time.Time `json:"created_at" gorm:"column:created_at;default:now()"`
					Contents    []byte    `json:"contents" gorm:"column:contents;type:json"`
				}
				type NotificationUser struct {
					NotificationId int `json:"notification_id" gorm:"column:notification_id;primaryKey"`
					UserId         int `json:"user_id" gorm:"column:user_id;primaryKey"`

					ReadAt *time.Time `json:"read_at" gorm:"column:read_at;default:now()"`
					IsRead bool       `json:"is_read" gorm:"column:is_read;default:false"`

					IsDismissed bool `json:"is_dismissed" gorm:"column:is_dismissed;default:false"`
				}

				if n == nil { // NOTE(xenobas): skips timeouts and reconnects
					continue
				}

				notificationIdStr := n.Extra
				notificationId, err := strconv.Atoi(notificationIdStr)
				if err != nil {
					continue
				}

				// TODO(xenobas): Refactor this stuff into a function
				notificationSentinel := Notification{}
				notificationSentinelQuery := hub.Db.
					Table("notifications").
					Where("id = ?", notificationId).
					First(&notificationSentinel)
				if notificationSentinelQuery.Error != nil {
					log.Printf("ERROR: DATABASE: Could not query notification#%03d: %v", notificationId, notificationSentinelQuery.Error)
					continue
				}

				var notificationContents struct {
					Type    *string `json:"type"`
					Title   *string `json:"title"`
					Message *string `json:"message"`
				}
				if err := json.Unmarshal(notificationSentinel.Contents, &notificationContents); err != nil {
					continue
				}

				notificationUsers := []NotificationUser{}
				notificationUsersQuery := hub.Db.
					Table("notification_users").
					Where("notification_id = ?", notificationId).
					Find(&notificationUsers)
				if notificationUsersQuery.Error != nil {
					log.Printf("ERROR: DATABASE: Could not query notifications#%03d: %v", notificationId, notificationUsersQuery.Error)
					continue
				}

				go func() {
					notificationType, notificationTitle, notificationMessage := "system", "Missing Title", ""
					if notificationContents.Type != nil {
						notificationType = *notificationContents.Type
					}
					if notificationContents.Title != nil {
						notificationTitle = *notificationContents.Title
					}
					if notificationContents.Message != nil {
						notificationMessage = *notificationContents.Message
					}

					log.Printf("DEBUG: NOTIFIER: Notification#%03d is being broadcast", notificationSentinel.Id)

					event := service.WsEvent{
						Event: "new",
						Payload: map[string]any{
							"id":         notificationSentinel.Id,
							"type":       notificationType,
							"title":      notificationTitle,
							"message":    notificationMessage,
							"link":       "",
							"is_read":    false,
							"created_at": notificationSentinel.CreatedAt,
						},
					}
					for _, notification := range notificationUsers {
						client, clientExists := hub.Clients[notification.UserId]
						if clientExists {
							for clientConnection := range client {
								service.SendToClient(hub, clientConnection, event)
							}
						}
					}
				}()
			case <-ctxListener.Done():
				return
			}
		}
	}()

	router := hub.RegisterRoutes()

	srv, port := config.NewServer(router)
	log.Printf("Notification Service Started On Port: %s !", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("SERVER ERROR: Failed to start the server: %v", err)
	}
}
