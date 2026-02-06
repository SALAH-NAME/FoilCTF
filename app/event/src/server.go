package main

import (
	"net/http"
	"gorm.io/gorm"
)

type Server struct {
	Db	*gorm.DB
	Conf Config
}


func(s *Server)ListEvents(w http.ResponseWriter, r *http.Request) {

}

func(s *Server)GetEvent(w http.ResponseWriter, r *http.Request) {

}

func(s *Server)GetScoreboard(w http.ResponseWriter, r *http.Request) {

}