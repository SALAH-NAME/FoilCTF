package config

import (
	"database/sql"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "github.com/lib/pq"
)

func DbDsn() string {
	dbHost := GetEnv("DB_HOST", "localhost")
	dbUser := GetEnv("DB_USER", "postgres")
	dbPass := GetEnv("DB_PASS", "postgres")
	dbName := GetEnv("DB_NAME", "foilctf")
	dbPort := GetEnv("DB_PORT", "5432")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPass, dbName, dbPort)
	return dsn
}

func DbInit() (*gorm.DB, error) {
	dsn := DbDsn()

	sqlDB, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("could not connect to database: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("could not ping database: %v", err)
	}

	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetMaxIdleConns(5)

	gormPostgresDialect := postgres.New(postgres.Config{Conn: sqlDB})
	gormDB, err := gorm.Open(gormPostgresDialect)
	if err != nil {
		return nil, fmt.Errorf("could not establish the gorm layer: %v", err)
	}

	return gormDB, nil
}
