.PHONY: help install build dev up down clean logs migrate test lint format

## Color codes
CYAN  := \033[36m
RESET := \033[0m

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing dependencies..."

build-shared: ## Build shared package
	@echo "Building shared package..."

build: build-shared ## Build all services
	@echo "Building all services..."

dev-shared: ## Run shared package in watch mode
	@echo "Running shared package in watch mode..."

dev-user: ## Run user service in development mode
	@echo "Running user service..."

dev-gateway: ## Run gateway service in development mode
	@echo "Running gateway service..."

dev-challenge: ## Run challenge service in development mode
	@echo "Running challenge service..."

dev-frontend: ## Run frontend in development mode
	@echo "Running frontend..."

up: ## Start all services with podman-compose
	@echo "Starting all services..."

up-build: ## Build and start all services
	@echo "Building and starting all services..."

down: ## Stop all services
	@echo "Stopping all services..."

down-volumes: ## Stop all services and remove volumes
	@echo "Stopping all services and removing volumes..."

restart: down up ## Restart all services

logs: ## Show logs from all services
	podman-compose logs -f

logs-user: ## Show logs from user service
	podman-compose logs -f user

logs-gateway: ## Show logs from gateway service
	podman-compose logs -f gateway

logs-database: ## Show logs from database service
	podman-compose logs -f database

logs-sandbox: ## Show logs from sandbox service
	podman-compose logs -f sandbox

clean: ## Clean build artifacts and dependencies
	@echo "Cleaning..."
	rm -rf node_modules
	rm -rf app/*/node_modules
	rm -rf app/*/dist
	rm -rf app/packages/dist
	pnpm store prune

migrate-list: ## List available database migrations
	@echo "Listing migrations..."

migrate-current: ## Show current migration version
	@echo "Current migration:"

migrate-apply: ## Apply pending database migrations
	@echo "Applying migrations..."

db-shell: ## Open PostgreSQL shell

db-backup: ## Backup database
	@echo "Backing up database..."

db-restore: ## Restore database from backup (usage: make db-restore FILE=backup.sql)
	@echo "Restoring database from $(FILE)..."

test: ## Run all tests
	@echo "Running tests..."

lint: ## Lint all code
	@echo "Linting..."

format: ## Format all code
	@echo "Formatting..."

check: ## Type check all TypeScript code
	@echo "Type checking..."

health: ## Check health of all services
	@echo "Checking service health..."

ps: ## Show running containers
	@echo "Listing running containers..."

stats: ## Show container resource usage
	@echo "Listing resource usage..."

env-generate: ## Generate .env from .env.example
	@if [ ! -f .env ]; then \
		echo "Generating .env file..."; \
		cp .env.example .env; \
		echo "Generated .env - Please update with secure values!"; \
	else \
		echo ".env already exists. Use 'rm .env' to regenerate."; \
	fi

init: env-generate install build-shared ## Initialize project for first time
	@echo ""
	@echo "✓ Project initialized!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env with secure passwords and JWT secret"
	@echo "  2. Run 'make up-build' to start all services"
	@echo "  3. Access http://localhost:PORT"

.DEFAULT_GOAL := help
