# sandbox
Tailor made REST API for manipulating podman

## Dependencies
- [Go](https://go.dev): Programming language designed for high performance web servers
- [Fiber v3](https://github.com/gofiber/fiber): HTTP server for implementing a REST API
- [Podman SDK](https://github.com/containers/podman/tree/main/libpod): Allows programmatical interaction with podman
- [Dotenv](https://github.com/joho/godotenv): `.env` loader

## Usage
```sh
cp .env.example .env
editor .env # fill with the appropriate values
go run .
```

## Features
- [x] OCI Images
	- [x] Create
	- [x] Inspect
	- [x] Delete
	- [x] Build
- [x] OCI Containers
	- [x] Create
	- [x] Start
	- [x] Inspect
	- [x] Stop
	- [x] Delete
- [ ] Healthcheck
- [ ] Logs monitoring
	- [ ] Polling
	- [ ] Streaming
- [ ] `auth` service integration
