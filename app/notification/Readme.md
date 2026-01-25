**Notification Service Prototype**

This service provides a realtime notification system for FoilCTF platform, it manages percistance of global announcements and synchronizes user specific "read/unread" states across multiple devices using the ```gorilla websocket```  

**Architecture Overview**

- Directory architechture:  

```bash
├── config
│   ├── database.go
│   └── setup.go
├── Containerfile
├── go.mod
├── go.sum
├── main.go
├── model
│   └── models.go
├── Readme.md
└── service
    ├── client.go
    ├── controllers.go
    ├── create.go
    ├── dismiss.go
    ├── events.go
    ├── hub.go
    ├── list_notifications.go
    └── mark_as_read.go

4 directories, 16 files
```
- Models  
    - ```Notification```(Global Store): Represents the physical announcement stored in ```notifications``` table using ```json.RawMessage``` for dynamic content.
    - ```NotificationResponse```(the API DTO): A non persistent data transfer object that merges global notification data with a calculated ```is_read``` boolean dirived from an ```EXISTS``` subquery.
    - ```UserNotification```(State Tracker):A many-to-many junction table to track "read" status per user.
    - ```WsEvent```(Message Envelope): the standard json envelope for WevSocket communication, containing the action ```event``` the ```target_id for routing and a generic metadata interface for payloads.
- The communication Hub:
    The Hub is the brain of the service. it manages:
    - ```Resgistration``` tracking active websocket connections.
    - ```GlobanChannel``` broadcasting channel.
    - ```Concurrency``` uses go channels, goroutines and mutexes to safely handle tousands of concurrent palayers

**API Reference**

| Method | Endpoint | Description |  
| :---   |  :---    | :---   |
| **GET**| api/notifications/ws | Websocket Upgrade: establishes the real-time persistent connection.
| **GET**| api/notifications| Fetch notification list (supports ```?limit=x```).
| **PATCH**|api/notifications/:id|Mark a single notification as read.
| **PATCH**| api/notifications|Mark ALL notifications as read.
| **DELETE**|api/notifications/:id| Dismiss/hide a specific notification for the current user.
|**DELETE**|api/notifications|Dismiss/hide ALL notifications for the current user.

**Websocket events**

| Event | Direction | Technical Description | UI effect|  
| :---   |  :---    | :---   | :---
| **new**| server->client | Broadcasts newly created notification object.|Adds a new item to the list
| **read**| server->client| confirmes a record was added to ```notification users```.| Turns off the "unread" style 
| **read_all**| server->client| confirmes all record were added to ```notification users```.| Updates the badge on the bell icon.
| **delete**| server->client| removes the **user-notification** link form DB.| removes the item from the UI list
| **delete_all**| server->client| removes all links for that user form DB.| clears the entire notification list

**Standalone service usage**  
- Connect to database (look at config/database.go)  
    **Note:** you have to insert records in depending tables and use the appropriate IDs. 
- Connect to Websocket, to do so we can use ```wscat``` command line:  
```bash
wscat -c ws://localhost:3004/api/notifications/ws -H "X-User-Id: 123"
```
- Triggering a global notification:  
Use this testing endpoint to simulate a new event, this will save the notification to PostgrSQL and broadcast it to all connected websocket clients.
```bash
curl -X POST http://localhost:3004/api/test/create \
     -H "Content-Type: application/json" \
     -d '{
           "type": "announcement",
           "title": "New Challenge",
           "message": "Web security level 1 is now open!",
           "link": "/challenges/web-1"
         }'
Notification created and broadcasted !
```
- Managing personal notifications:  
These endpoints require an ```X-User-Id``` header to identify which user is performing the action.  
    - **List notifications:**  
    ```bash 
    curl -H "X-User-Id: 123" "http://localhost:3004/api/notifications/?limit=10"
    ```
    - **Mark a single notification as read:**
    ```bash 
    curl -X PATCH -H "X-User-Id: 123" http://localhost:3004/api/notifications/1
    ```
    - **Mark ALL notifications as read:**
    ```bash 
    curl -X PATCH -H "X-User-Id: 123" http://localhost:3004/api/notifications/
    ```
    - **Dismiss a notification:**
    ```bash 
    curl -X DELETE -H "X-User-Id: 123" http://localhost:3004/api/notifications/1
    ```
    - **Dismiss ALL notifications:**
    ```bash 
    curl -X DELETE -H "X-User-Id: 123" http://localhost:3004/api/notifications/
    ```