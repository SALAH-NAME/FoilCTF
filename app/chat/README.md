**Core Dependencies**
- **gorilla/websocket**: Handles protocol upgrading and low-level frame management.
- **gorilla/mux**: request routing and middleware integration.
- **golang-jwt/jwt/v5**: Secure token parsing and identity verification.
- **gorm.io/gorm**: ORM for database.

**Concurrency model**  
*  Hub: maintains global state.
*  Channels: used for thrad-safe communication .
*  Goroutines : every connected user gets two lightweight goroutines (one for reading and one for writing).

**Channels**
- The Hub synchronizes server state via TrackChannels, utilizing three core channels:  
1. **Register / Unregister:** Handles client lifecycles, map updates, and connection cleanup.
3. **MessageChannel** a buffered channel for al real time events:  
        - ```message``` Validates rate limits/length, persists to PostgreSQL, and broadcasts.  
        - ```typing``` "pass-through" broadcast.    
        - ```edit``` Enforces authorship and a 1-minute window before DB sync.  
        - ```delete``` Executes soft deletes via deleted_at timestamps for data auditability.  

**endpoints**
- ```GET /api/chat:``` Upgrades connection to WebSocket.
- ```GET /api/chat/list:``` Returns a JSON array of the most recent messages for a specific room using GORM.
- ```GET /api/chat/users:``` Returns a list of currently online users and their metadata.

**Standalone service usage**  
The chat service is designed to run as a microservice behind a Gateway. For standalone testing or development, follow these steps.


1. Configuration  
The service expects the following evironment variables to connect to database. for testing purposes we use ```localhost``` as the database host.  
*  DB_HOST
*  DB_USER  
*  DB_PASS  
*  DB_NAME
*  DB_PORT

2. Build and run the service
3. Mannual testing (Standalone)  
- For testing purpose use `https://token.dev/` to generate JWT tokens, use the secrete key example in .env (don't forget to turn off Base64 encoded button):
```json
// header
{
  "typ": "JWT",
  "alg": "HS256"
}
// payload
{
  "userid": "idexample",
  "username": "example",
  "role": "player",
  "exp": 1956480000
}
```
- Websocket interface: use Use ```wscat``` to simulate the handshake. Note that you must provide the headers the service expects.
```bash
wscat -c "ws://localhost:3003/api/chat?room=1" -H "Authorization: Bearer YOUR JWT token"
```
- Example of message: 
```json
{"content": "Hello everyone!", "event": "message"}
```