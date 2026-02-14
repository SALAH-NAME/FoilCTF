**Notification Service Prototype**

This service provides a realtime notification system for FoilCTF platform, it manages percistance of global announcements and synchronizes user specific "read/unread" states across multiple devices using the ```gorilla websocket```  

**Architecture Overview**

- Models  
    - ```Notification```(Global Store): Represents the physical announcement stored in ```notifications``` table using ```json.RawMessage``` for dynamic content.
    - ```NotificationResponse```(the API DTO): A non persistent data transfer object that merges global notification data.
    - ```UserNotification```(State Tracker):A many-to-many junction table to track "read" and "deleted" status per user.
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
- Connect to Websocket, to do so we can use ```wscat``` command line:
- For testing purpose use `https://token.dev/` to generate JWT tokens, use the secrete key example in .env (don't forget to turn off Base64 encoded button):
```json
// header
{
  "typ": "JWT",
  "alg": "HS256"
}
// payload
{
  "userid": "ID",
  "role": "ROLE",
  "exp": 1956480000
}
```
```bash
wscat -c ws://localhost:3004/api/notifications/ws -H "Authorization: Bearer TOKEN_HERE"
```

- Triggering a global notification:  
Use this testing endpoint to simulate a new event, this will save the notification to PostgrSQL and broadcast it to all connected websocket clients.
```bash
curl -X POST -H-H "Authorization: Bearer TOKEN_HERE" http://localhost:3004/api/test/create \
     -H "Content-Type: application/json" \
     -d '{
           "type": "announcement",
           "title": "New Challenge",
           "message": "Web security level 1 is now open!",
           "link": "/challenges/web-1"
         }'
```
- Managing personal notifications:  
    - **List notifications:**  
    ```bash 
    curl -H "Authorization: Bearer TOKEN_HERE" "http://localhost:3004/api/notifications/?limit=10"
    ```
    - **Mark a single notification as read:**
    ```bash 
    curl -X PATCH -H "Authorization: Bearer TOKEN_HERE" http://localhost:3004/api/notifications/1
    ```
    - **Mark ALL notifications as read:**
    ```bash 
    curl -X PATCH -H "Authorization: Bearer TOKEN_HERE" http://localhost:3004/api/notifications/
    ```
    - **Dismiss a notification:**
    ```bash 
    curl -X DELETE -H "Authorization: Bearer TOKEN_HERE" http://localhost:3004/api/notifications/1
    ```
    - **Dismiss ALL notifications:**
    ```bash 
    curl -X DELETE -H "Authorization: Bearer TOKEN_HERE" http://localhost:3004/api/notifications/
    ```