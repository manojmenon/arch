#!/bin/bash

# Local development setup script
set -e

echo "Starting local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=project_management

# JWT
JWT_SECRET=your-secret-key-change-in-production

# OpenTelemetry
OTEL_ENDPOINT=http://otel-collector:4318/v1/traces
OTEL_ENABLED=true

# Environment
ENVIRONMENT=development
EOF
fi

# Start services
echo "Starting services with docker-compose..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "Checking PostgreSQL connection..."
until docker-compose exec postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Run database migrations
echo "Running database migrations..."
docker-compose exec postgres psql -U postgres -d project_management -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose exec postgres psql -U postgres -d project_management -f /docker-entrypoint-initdb.d/002_seed_data.sql

# Seed database with dummy data
echo "Seeding database with dummy data..."
cd ..
go run scripts/seed_projects.go

echo "Local development environment is ready!"
echo ""
echo "Services:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8080"
echo "  API Documentation: http://localhost:8080/swagger/index.html"
echo "  PostgreSQL: localhost:5432"
echo "  OpenTelemetry Collector: http://localhost:4318"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To stop the services, run: docker-compose down"

