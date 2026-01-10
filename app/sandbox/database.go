package main

import (
	"database/sql"

	_ "github.com/lib/pq"
)

func Database_Connect(dbUri string) (*sql.DB, error) {
	return sql.Open("postgres", dbUri)
}

func Database_Disconnect(db *sql.DB) error {
	return db.Close()
}
