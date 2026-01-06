package main

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func Database_Connect(user string, pass string) (*sql.DB, error) {
	if len(pass) > 0 {
		pass = ":" + pass
	}

	// TODO(xenobas): Activate SSL
	// TODO(xenobas): Configure timeout
	connStr := fmt.Sprintf("postgresql://%s%s@localhost/?connect_timeout=10&sslmode=disable", user, pass)
	return sql.Open("postgres", connStr)
}

func Database_Disconnect(db *sql.DB) error {
	return db.Close()
}

// 		db, err := Database_Connect()
// 		if err != nil {
// 			log.Fatal("Failed connection")
// 		}
// 		defer Database_Disconnect(db)

// 		rows, err := db.Query(`SELECT * FROM users`)
// 		if err != nil {
// 			log.Fatal(err)
// 		}
// 		defer rows.Close()

// 		for rows.Next() {
// 			log.Println("Row")
// 		}
