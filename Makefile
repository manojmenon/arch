.PHONY: setup-env build run-local seed kind-deploy ansible-deploy test clean help

# Default target
help:
	@echo "Available targets:"
	@echo "  setup-env      - Set up environment files with secure secrets"
	@echo "  build          - Build all components"
	@echo "  run-local      - Start local development environment"
	@echo "  seed           - Seed database with dummy data"
	@echo "  kind-deploy    - Deploy to kind cluster"
	@echo "  ansible-deploy - Deploy to remote server"
	@echo "  test           - Run all tests"
	@echo "  clean          - Clean build artifacts"

# Set up environment files
setup-env:
	@echo "Setting up environment files..."
	./scripts/setup-env.sh

# Build all components
build:
	@echo "Building frontend..."
	cd frontend && npm install && npm run build
	@echo "Building backend..."
	cd backend && go mod tidy && go build -o bin/auth ./cmd/auth && go build -o bin/projects ./cmd/projects && go build -o bin/mcp ./cmd/mcp
	@echo "Build complete"

# Start local development environment
run-local:
	@echo "Starting local development environment..."
	@if [ ! -f "frontend/.env.development" ] || [ ! -f "backend/.env.development" ]; then \
		echo "Environment files not found. Running setup-env first..."; \
		$(MAKE) setup-env; \
	fi
	docker-compose -f scripts/docker-compose.yml --env-file scripts/env.docker-compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	@echo "Local environment ready at http://localhost:3000"

# Seed database with dummy data
seed:
	@echo "Seeding database..."
	cd scripts && go run seed_projects.go
	@echo "Database seeded with 100 dummy projects"

# Deploy to kind cluster
kind-deploy:
	@echo "Creating kind cluster..."
	./infra/kind/create_kind.sh
	@echo "Deploying applications..."
	kubectl apply -f infra/k8s/
	@echo "Kind deployment complete"

# Deploy to remote server with Ansible
ansible-deploy:
	@echo "Deploying to remote server..."
	ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml
	@echo "Ansible deployment complete"

# Run all tests
test:
	@echo "Running backend tests..."
	cd backend && go test ./...
	@echo "Running frontend tests..."
	cd frontend && npm test
	@echo "Running integration tests..."
	cd scripts && go test ./...

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/bin
	rm -rf backend/vendor
	docker-compose -f scripts/docker-compose.yml down -v
	@echo "Clean complete"

