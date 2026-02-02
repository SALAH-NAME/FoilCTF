package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Environment struct {
	DatabaseUri string

	ServerAddress string

	PodmanUri       string
	PodmanDirImages string
	PodmanDirHealth string
}

func LoadEnvironment() (env Environment, err error) {
	type Entry struct {
		fallback string
		slot     *string
		filepath bool
	}

	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(".env"); err != nil {
			return env, err
		}
		log.Printf("environment is loaded from file %q", ".env")
	} else if !os.IsNotExist(err) {
		return env, err
	}

	entries := map[string]Entry{
		"SERVER_ADDRESS":    {fallback: ":3006", slot: &env.ServerAddress},
		"PODMAN_DIR_IMAGES": {fallback: "runtime/images", slot: &env.PodmanDirImages, filepath: true },
		"PODMAN_DIR_HEALTH": {fallback: "runtime/health", slot: &env.PodmanDirHealth, filepath: true },
		"PODMAN_URI":        {fallback: "", slot: &env.PodmanUri},
		"DATABASE_URI":      {fallback: "", slot: &env.DatabaseUri},
	}
	for key, entry := range entries {
		value, exists := os.LookupEnv(key)
		if !exists && entry.fallback == "" {
			return env, fmt.Errorf("required environment variable %q is not set", key)
		}

		*entry.slot = entry.fallback
		if exists {
			*entry.slot = value
		}

		if entry.filepath {
			var err error
			if *entry.slot, err = filepath.Abs(*entry.slot); err != nil {
				return env, err
			}
		}
		log.Printf("environment variable %q is now set to %q", key, *entry.slot)
	}

	return env, nil
}
