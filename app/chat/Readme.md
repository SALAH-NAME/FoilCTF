**Concurrency model**  
*  Hub: maintains global state  
*  Channels: used for thrad-safe communication 
*  Goroutines : every connected user gets two lightweight goroutines (one for reading and one for writing) (look at ```serveChat()``` function)

**The Hub**
- I used the ```Hub``` as the brain of the service, it manages the state of the chat and ensures that every action (joining, leaving, messaging) happens in a safe synchronized order. 
```go
type Hub struct {
	db             *gorm.DB            -----> database connection
	MessageChannel chan Message 
	register       chan *Client        
	unregister     chan *Client
	clients        map[*Client]bool    -----> tracking online users
	upgrader       websocket.Upgrader
	mutex          sync.Mutex          
}
```
**Channels**
- As you can see I used three channels which are managed by the ```hubChannel.TrackChannels()``` function running in the background:  
1. **```register```** when the user passes authentication in ```serveChat()``` the ```client``` object is sent to this channel to add them into map ```map[*Client]bool``` and trigger "join" broadcast  
2. **```unregister```** acts as a clean up for disconnected users which is detected in ```readFromConnectionTunnel()``` function, I close their private channel  ```send``` and i remove them from the map
3. **```MessageChannel```** a buffered channels that handles all real-time data (messages, typings, edits, deletes), it receives any json payload and the hub routes it to the correct handler.  
        - ```message``` before processing the Hub checks rate limiting and content validity(length), if valid saves the record to PostresSQL for history retrieval and then broadcasts it to all connected clients in the room.  
        - ```typing``` this event is strictly a "pass-through", I just broadcast it to all connected clients in the room.  
        -```edit``` I check if the request falls within one-minute period and the requester is the original author, then update the database record and broadcast it.  
        -```delete``` Insteed of removing the row, i perform a soft delete by updating the deleted_at timestamp ensuring te content is hidden from users but preserved for organizers.

**endpoints**
* **Websocket upgrading:**   the primary ```/api/chat``` acts as a gateway it uses ```Gorilla Websocket Upgrader``` to trasform HTTP requests into a long-lived bidirectional connections, before upgrading "Role-Based Access Control" is checked. the endpoint is managed by ```serveChat()``` method.  
* **Chat History:**   the ```/api/chat/messages``` endpoint is managed as a standard GET request. it queries PostgresSQL via GORM to fetch 50 most recent records ```serveChatHistory()``` method..  
* **User Monitoring:**  the ```/api/users```  allows server to safely export the "online" state as a JSON response without interfering with the active broadcast loops, it uses a Mutex-protected read operation on the Hub's internal client map, it is manages by ```serveGetUsers()``` method.  
**Usedlibraries**

**resources**
- https://go.dev/tour/welcome/1
- https://pkg.go.dev/github.com/gorilla/websocket#section-readme
- https://medium.com/@Aleroawani/bridging-functions-and-interfaces-how-http-handlerfunc-23433314f120
- https://pkg.go.dev/github.com/google/uuid
- https://medium.com/@parvjn616/building-a-websocket-chat-application-in-go-388fff758575