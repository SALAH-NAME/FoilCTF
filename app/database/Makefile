-include .env
export

# Container & Image Names
CONTAINER_NAME      := foilctf_database
IMAGE_NAME          := localhost/foilctf/database
IMAGE_TAG           := latest

# Runtime (podman / docker)
ENGINE ?= docker

# Network Configuration
NETWORK_NAME        := foilctf_net
PUBLISH_PORT        := 5432:5432

# Volume Configuration
PGDATA_MOUNT        := $(DATABASE_VOLUME_DATA_MOUNT)

# Use named volume if DATABASE_VOLUME_DATA_DIR is not set
ifdef DATABASE_VOLUME_DATA_DIR
PGDATA_DIR          := $(DATABASE_VOLUME_DATA_DIR)
VOLUME_TYPE         := bind
else
PGDATA_DIR          := foilctf_postgres
VOLUME_TYPE         := volume
endif

# Migrations volume configuration
MIGRATIONS_MOUNT    := $(DATABASE_VOLUME_MIGRATIONS_MOUNT)

MIGRATIONS_DIR      := ./migrations

# Database Configuration
DB_NAME             := $(DATABASE_NAME)
DB_ADMIN_USER       := $(DATABASE_ADMIN_USER)
DB_ADMIN_PASS       := $(DATABASE_ADMIN_PASS)
DB_DEVELOPER_USER   := $(DATABASE_DEVELOPER_USER)
DB_DEVELOPER_PASS   := $(DATABASE_DEVELOPER_PASS)
DB_LOGS             := $(DATABASE_LOGS)

# Healthcheck Configuration
HEALTHCHECK_CMD     := pg_isready -d "$(DB_NAME)" -U "$(DB_ADMIN_USER)" && \
                       psql -d "$(DB_NAME)" -U "$(DB_ADMIN_USER)" -tAc "SELECT 1 FROM users LIMIT 1" > /dev/null 2>&1

## Color codes
CYAN  := \033[36m
RESET := \033[0m

.env: ## Generate .env from .env.example
		@echo "$(CYAN)No .env found, creating from .env.example...$(RESET)";
		@echo "$(CYAN)";
		cp .env.example .env;
		@echo "$(RESET)";

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'

all: setup build run ## Setup, build and run
	@echo "Database service is ready!"

build: ## Build the database image
	@echo "Building database image: $(IMAGE_NAME):$(IMAGE_TAG)"
	$(ENGINE) image build \
		--tag $(IMAGE_NAME):$(IMAGE_TAG) \
		--file Containerfile .
	@echo "Image built successfully"

setup: network-create volume-setup ## Create required volumes and network
	@echo "Setup completed"

run: setup ## Run database container (detached)
	@echo "Starting database container: $(CONTAINER_NAME)"
	@echo "    Publishing port: $(PUBLISH_PORT)"
	@echo "    Database: $(DB_NAME)"
	@echo "    User: $(DB_ADMIN_USER)"
	@echo "    Volume type: $(VOLUME_TYPE)"
	$(ENGINE) container run \
		--name $(CONTAINER_NAME) \
		--detach \
		--network $(NETWORK_NAME) \
		--publish $(PUBLISH_PORT) \
		--env PGDATA=$(PGDATA_MOUNT) \
		--env PGLOGS=$(DB_LOGS) \
		--env POSTGRES_DB=$(DB_NAME) \
		--env POSTGRES_USER=$(DB_ADMIN_USER) \
		--env POSTGRES_PASSWORD=$(DB_ADMIN_PASS) \
		--env DATABASE_MIGRATIONS_MOUNT=$(MIGRATIONS_MOUNT) \
		--env DATABASE_DEVELOPER_USER=$(DB_DEVELOPER_USER) \
		--env DATABASE_DEVELOPER_PASS=$(DB_DEVELOPER_PASS) \
		--volume $(PGDATA_DIR):$(PGDATA_MOUNT):Z \
		--volume $(MIGRATIONS_DIR):$(MIGRATIONS_MOUNT):Z,ro \
		$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Database container started"
	@echo "  Container ID: $$($(ENGINE) ps -q -f name=$(CONTAINER_NAME))"

start: ## Start stopped container
	@echo "Starting stopped container: $(CONTAINER_NAME)"
	$(ENGINE) container start $(CONTAINER_NAME)
	@echo "Container started"

stop: ## Stop running container
	@echo "Stopping container: $(CONTAINER_NAME)"
	$(ENGINE) container stop $(CONTAINER_NAME)
	@echo "Container stopped"

restart: ## Restart container
	@echo "Restarting container: $(CONTAINER_NAME)"
	$(ENGINE) container restart $(CONTAINER_NAME)
	@echo "Container restarted"

status: ## Show container status
	@echo "Container Status:"
	@$(ENGINE) ps -a -f name=$(CONTAINER_NAME)

logs: ## Follow container logs
	@echo "Viewing logs for: $(CONTAINER_NAME)"
	$(ENGINE) container logs $(CONTAINER_NAME)

shell: ## Open psql shell
	@echo "Opening psql shell in container"
	@echo "    Database: $(DB_NAME)"
	@echo "    User: $(DB_ADMIN_USER)"
	$(ENGINE) exec -it $(CONTAINER_NAME) psql -U $(DB_ADMIN_USER) -d $(DB_NAME)

bash: ## Open bash shell
	@echo "Opening bash shell in container"
	$(ENGINE) exec -it $(CONTAINER_NAME) bash

inspect: ## Inspect container details
	@echo "Inspecting container: $(CONTAINER_NAME)"
	$(ENGINE) container inspect $(CONTAINER_NAME)

healthcheck: ## Run health check
	@echo "Running manual health check"
	@echo "Check PostgreSQL is ready..."
	@$(ENGINE) exec $(CONTAINER_NAME) pg_isready -d "$(DB_NAME)" -U "$(DB_ADMIN_USER)" && echo "PostgreSQL is accepting connections" || (echo "✗ PostgreSQL not ready"; exit 1)
	@echo "Check if database is initialized..."
	@$(ENGINE) exec $(CONTAINER_NAME) psql -d "$(DB_NAME)" -U "$(DB_ADMIN_USER)" -tAc "SELECT 1 FROM users LIMIT 1" > /dev/null 2>&1 && echo "Database is initialized (users table exists)" || echo "⚠ Database not initialized (users table missing - migrations may not have run)"
	@echo "Overall health status:"
	@$(ENGINE) exec $(CONTAINER_NAME) sh -c '$(HEALTHCHECK_CMD)' && echo "Database is healthy" || echo "✗ Health check failed"

volume-setup: ## Setup volumes
	@echo "Setting up volumes"
	@echo "    Data directory: $(PGDATA_DIR)"
	@echo "    Migrations directory: $(MIGRATIONS_DIR)"
ifeq ($(VOLUME_TYPE),bind)
	@mkdir -p $(PGDATA_DIR)
else
	@$(ENGINE) volume exists $(PGDATA_DIR) || $(ENGINE) volume create $(PGDATA_DIR)
endif
	@mkdir -p $(MIGRATIONS_DIR)
	@echo "Volumes ready"

volume-info: ## Show volume information
	@echo "Volume Information:"
	@echo "    PostgreSQL Data:"
	@echo "      Host Path: $(PGDATA_DIR)"
	@echo "      Container Mount: $(PGDATA_MOUNT)"
	@echo ""
	@echo "    Migrations:"
	@echo "      Host Path: $(MIGRATIONS_DIR)"
	@echo "      Container Mount: $(MIGRATIONS_MOUNT)"

network-create: ## Create network
	@echo "Creating network: $(NETWORK_NAME)"
	@$(ENGINE) network exists $(NETWORK_NAME) || \
		$(ENGINE) network create $(NETWORK_NAME)
	@echo "Network ready"

network-info: ## Show network information
	@echo "Network Information:"
	$(ENGINE) network inspect $(NETWORK_NAME)

clean: ## Stop and remove container
	@echo "Cleaning up container"
	-$(ENGINE) container stop $(CONTAINER_NAME) 2>/dev/null
	-$(ENGINE) container rm $(CONTAINER_NAME) 2>/dev/null
	@echo "Container removed"

clean-image: ## Remove image
	@echo "Removing image: $(IMAGE_NAME):$(IMAGE_TAG)"
	-$(ENGINE) image rm $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Image removed"

clean-volumes: ## Delete volume data 
	@echo "WARNING: Deleting all database data!"
	@echo "    Volume: $(PGDATA_DIR) (type: $(VOLUME_TYPE))"
ifeq ($(VOLUME_TYPE),bind)
	@rm -rf $(PGDATA_DIR)/*
	@echo "Bind mount data deleted"
else
	@$(ENGINE) volume rm $(PGDATA_DIR) 2>/dev/null || true
	@echo "Named volume deleted"
endif

clean-network: ## Remove network
	@echo "Removing network: $(NETWORK_NAME)"
	-$(ENGINE) network rm $(NETWORK_NAME) 2>/dev/null
	@echo "Network removed"

clean-all: clean clean-image clean-network ## Full cleanup (keeps data)
	@echo "Full cleanup completed"
	@echo "    Note: Volume data preserved in $(PGDATA_DIR)"
	@echo "    Use 'make clean-volumes' to remove data"

env-check: ## Environment Variables Check
	@echo "Environment Variables Check:"
	@echo "    ENGINE: $(ENGINE)"
	@echo "    DATABASE_NAME: $(DB_NAME)"
	@echo "    DATABASE_ADMIN_USER: $(DB_ADMIN_USER)"
	@echo "    DATABASE_ADMIN_PASS: $(DB_ADMIN_PASS)"
	@echo "    DATABASE_DEVELOPER_USER: $(DB_DEVELOPER_USER)"
	@echo "    DATABASE_DEVELOPER_PASS: $(DB_DEVELOPER_PASS)"
	@echo "    DATABASE_VOLUME_DATA_DIR: $(PGDATA_DIR)"
	@echo "    DATABASE_VOLUME_MIGRATIONS_DIR: $(MIGRATIONS_DIR)"
	@echo "    VOLUME_TYPE: $(VOLUME_TYPE)"
	@echo "    CONTAINER_NAME: $(CONTAINER_NAME)"
	@echo "    IMAGE_NAME: $(IMAGE_NAME):$(IMAGE_TAG)"
	@echo "    NETWORK_NAME: $(NETWORK_NAME)"


.PHONY: help all build setup run start stop restart status logs shell bash inspect healthcheck volume-setup volume-info network-create network-info clean clean-image clean-volumes clean-network clean-all env-check
.DEFAULT_GOAL := help
