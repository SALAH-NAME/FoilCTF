# sandbox
REST API exposing Podman SDK's capabilities

## Dependencies
- Go
- Chi
- Podman SDK
- godotenv

## Getting started
```sh
systemctl start --user podman.socket
cp .env.example .env # Make sure to fill ".env" with the appropriate values
go run .
```
