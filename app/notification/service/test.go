package service

import (
	"encoding/json"
	"log"
	"net/http"
)

func (hub *Hub)Test(w http.ResponseWriter, r *http.Request) {
	var data struct {
		Type string `json:"type"`
		Title string `json:"title"`
		Message string `json:"message"`
		Link string `json:"link"`
	}
	if err:= json.NewDecoder(r.Body).Decode(&data); err != nil {
		log.Printf("Invalid JSON data: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if err := hub.CreateNotification(data.Type, data.Title, data.Message, data.Link); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Notification created and broadcasted !"))
}