#!/bin/bash

# Environment Setup Script for Project Management System
set -e

echo "Setting up environment files for Project Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "Environment Setup"

# Create environment files if they don't exist
print_status "Creating environment files..."

# Frontend environment files
if [ ! -f "frontend/.env.development" ]; then
    print_status "Creating frontend/.env.development"
    cp frontend/env.development frontend/.env.development
fi

if [ ! -f "frontend/.env.production" ]; then
    print_status "Creating frontend/.env.production"
    cp frontend/env.production frontend/.env.production
fi

# Backend environment files
if [ ! -f "backend/.env.development" ]; then
    print_status "Creating backend/.env.development"
    cp backend/env.development backend/.env.development
fi

if [ ! -f "backend/.env.production" ]; then
    print_status "Creating backend/.env.production"
    cp backend/env.production backend/.env.production
fi

# Database environment file
if [ ! -f "scripts/.env.database" ]; then
    print_status "Creating scripts/.env.database"
    cp scripts/env.database scripts/.env.database
fi

# Docker Compose environment file
if [ ! -f "scripts/.env.docker-compose" ]; then
    print_status "Creating scripts/.env.docker-compose"
    cp scripts/env.docker-compose scripts/.env.docker-compose
fi

print_header "Environment Configuration"

# Generate secure secrets
print_status "Generating secure secrets..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-secure-jwt-secret-$(date +%s)")
DB_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "secure-password-$(date +%s)")

print_status "Generated JWT secret: ${JWT_SECRET:0:20}..."
print_status "Generated DB password: ${DB_PASSWORD:0:10}..."

# Update backend development environment
print_status "Updating backend development environment..."
sed -i.bak "s|your-secret-key-change-in-production|$JWT_SECRET|g" backend/.env.development
sed -i.bak "s|password|$DB_PASSWORD|g" backend/.env.development

# Update database environment
print_status "Updating database environment..."
sed -i.bak "s|password|$DB_PASSWORD|g" scripts/.env.database

# Update docker-compose environment
print_status "Updating docker-compose environment..."
sed -i.bak "s|password|$DB_PASSWORD|g" scripts/.env.docker-compose

# Clean up backup files
rm -f backend/.env.development.bak
rm -f scripts/.env.database.bak
rm -f scripts/.env.docker-compose.bak

print_header "Environment Validation"

# Validate environment files
print_status "Validating environment files..."

# Check if required variables are set
check_env_var() {
    local file=$1
    local var=$2
    if grep -q "^$var=" "$file"; then
        print_status "✓ $var is set in $file"
    else
        print_warning "⚠ $var is not set in $file"
    fi
}

# Check frontend environment
print_status "Checking frontend environment..."
check_env_var "frontend/.env.development" "VITE_API_BASE_URL"
check_env_var "frontend/.env.development" "VITE_APP_NAME"

# Check backend environment
print_status "Checking backend environment..."
check_env_var "backend/.env.development" "JWT_SECRET"
check_env_var "backend/.env.development" "DB_PASSWORD"
check_env_var "backend/.env.development" "OTEL_ENDPOINT"

# Check database environment
print_status "Checking database environment..."
check_env_var "scripts/.env.database" "POSTGRES_PASSWORD"
check_env_var "scripts/.env.database" "POSTGRES_DB"

print_header "Environment Summary"

echo "Environment files created and configured:"
echo "  📁 frontend/.env.development"
echo "  📁 frontend/.env.production"
echo "  📁 backend/.env.development"
echo "  📁 backend/.env.production"
echo "  📁 scripts/.env.database"
echo "  📁 scripts/.env.docker-compose"

echo ""
echo "Key configuration:"
echo "  🔐 JWT Secret: Generated and configured"
echo "  🗄️  Database Password: Generated and configured"
echo "  🌐 API Base URL: http://localhost:8080 (development)"
echo "  📊 OpenTelemetry: Enabled and configured"

echo ""
print_status "Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and customize environment files as needed"
echo "  2. Run 'make run-local' to start the development environment"
echo "  3. Access the application at http://localhost:3000"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
