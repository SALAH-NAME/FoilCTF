.PHONY: help build up down logs restart fclean

COMPOSE ?= podman-compose

## Color codes
CYAN  := \033[36m
RESET := \033[0m

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'

init: env-generate ## Initialize project for first time
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env with secure passwords and JWT secret"
	@echo "  2. Run 'make build && make up' to start all services"
	@echo "  3. Access https://localhost:PORT"

up: ## Start all services with $(COMPOSE)
	@echo "Starting all services..."
	$(COMPOSE) up -d

build: ## Build  all services
	@echo "Building all services..."
	$(COMPOSE) build

down: ## Stop all services
	@echo "Stopping all services..."
	$(COMPOSE) down

restart: ## Restart all services
	@echo "Restrating all services..."
	$(COMPOSE) restart

ps: ## Show services status
	$(COMPOSE) ps

logs: ## Show logs from all services
	$(COMPOSE) logs -f

fclean: ## Clean all (volumes)
	@echo "Cleaning..."
	@echo "Warning: This will remove all volumes!"
	@echo "Press [Enter] to Continue or to cancel press [Ctrl+C]"
	@read dummy
	$(COMPOSE) down --volumes

env-generate: ## Generate .env from .env.example
	@if [ ! -f .env ]; then \
		echo "Generating .env file..."; \
		cp .env.example .env; \
		echo "Generated .env - Please update with secure values!"; \
	else \
		echo ".env already exists. Use 'rm .env' to regenerate."; \
	fi

.DEFAULT_GOAL := help
