package service

import (
	"encoding/json"
	"net/http"
)

func JSONError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "error", 
		"code"  : code,
		"message": message, 
	})
}
