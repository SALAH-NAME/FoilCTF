package main

import (
	"encoding/json"
	"net/http"
)

func JSONError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	resp := map[string]any{
		"status":  "error",
		"code":    code,
		"message": message,
	}
	json.NewEncoder(w).Encode(resp)
}
