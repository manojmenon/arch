# Environment Configuration Guide

This document explains how to configure the Project Management System using environment files for different components and deployment scenarios.

## Overview

The system uses environment-specific configuration files to manage settings for:
- **Frontend** (React/Vite application)
- **Backend** (Go services)
- **Database** (PostgreSQL)
- **Docker Compose** (Local development)
- **Kubernetes** (Production deployment)

## Quick Start

### 1. Automatic Setup (Recommended)

```bash
# Set up all environment files with secure secrets
make setup-env

# Start the development environment
make run-local
```

### 2. Manual Setup

If you prefer to configure manually, copy the example files and customize:

```bash
# Frontend
cp frontend/env.development frontend/.env.development
cp frontend/env.production frontend/.env.production

# Backend
cp backend/env.development backend/.env.development
cp backend/env.production backend/.env.production

# Database
cp scripts/env.database scripts/.env.database

# Docker Compose
cp scripts/env.docker-compose scripts/.env.docker-compose
```

## Environment Files Structure

```
├─ frontend/
│  ├─ env.development          # Frontend development config
│  ├─ env.production           # Frontend production config
│  ├─ .env.development         # Generated development config
│  └─ .env.production          # Generated production config
├─ backend/
│  ├─ env.development          # Backend development config
│  ├─ env.production           # Backend production config
│  ├─ .env.development         # Generated development config
│  └─ .env.production          # Generated production config
└─ scripts/
   ├─ env.database             # Database configuration
   ├─ env.docker-compose       # Docker Compose configuration
   ├─ .env.database            # Generated database config
   └─ .env.docker-compose      # Generated Docker Compose config
```

## Component Configuration

### Frontend Environment Variables

**Development (`frontend/.env.development`):**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=10000

# Application Configuration
VITE_APP_NAME=Project Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false

# UI Configuration
VITE_THEME=light
VITE_DEFAULT_PAGE_SIZE=50
```

**Production (`frontend/.env.production`):**
```bash
# API Configuration
VITE_API_BASE_URL=https://api.projectmanagement.com
VITE_API_TIMEOUT=15000

# Application Configuration
VITE_APP_NAME=Project Management System
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true

# External Services
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

### Backend Environment Variables

**Development (`backend/.env.development`):**
```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
ENVIRONMENT=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=project_management
DB_SSL_MODE=disable

# Authentication Configuration
JWT_SECRET=your-secure-jwt-secret
SESSION_DURATION=24h
TOKEN_DURATION=4h

# OpenTelemetry Configuration
OTEL_ENABLED=true
OTEL_ENDPOINT=http://localhost:4318/v1/traces

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=console
```

**Production (`backend/.env.production`):**
```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
ENVIRONMENT=production

# Database Configuration
DB_HOST=postgres-service
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-very-secure-production-password
DB_NAME=project_management
DB_SSL_MODE=require

# Authentication Configuration
JWT_SECRET=your-very-secure-jwt-secret-for-production
SESSION_DURATION=8h
TOKEN_DURATION=4h

# OpenTelemetry Configuration
OTEL_ENABLED=true
OTEL_ENDPOINT=http://otel-collector:4318/v1/traces

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Security Configuration
CORS_ALLOWED_ORIGINS=https://app.projectmanagement.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=1000
```

### Database Environment Variables

**Database (`scripts/.env.database`):**
```bash
# PostgreSQL Configuration
POSTGRES_DB=project_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Performance Configuration
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
POSTGRES_MAX_CONNECTIONS=100

# Logging Configuration
POSTGRES_LOG_STATEMENT=all
POSTGRES_LOG_MIN_DURATION_STATEMENT=1000

# Security Configuration
POSTGRES_SSL=on
```

### Docker Compose Environment Variables

**Docker Compose (`scripts/.env.docker-compose`):**
```bash
# Application Configuration
APP_NAME=project-management
APP_VERSION=1.0.0
APP_ENVIRONMENT=development

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=8080
POSTGRES_PORT=5432

# Resource Limits
FRONTEND_MEMORY_LIMIT=512m
BACKEND_MEMORY_LIMIT=1g
POSTGRES_MEMORY_LIMIT=2g

# Development Configuration
DEV_MODE=true
DEBUG_MODE=true
HOT_RELOAD=true
```

## Environment-Specific Configurations

### Development Environment

**Characteristics:**
- Debug logging enabled
- Hot reload for frontend
- Local database connection
- Development API endpoints
- Relaxed security settings

**Usage:**
```bash
# Start development environment
make run-local

# Access points
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Database: localhost:5432
```

### Production Environment

**Characteristics:**
- Optimized logging
- Production API endpoints
- Secure database connections
- Strict security settings
- Performance monitoring

**Usage:**
```bash
# Deploy to production
make kind-deploy

# Or use Ansible for remote deployment
make ansible-deploy
```

## Security Considerations

### Secret Management

**Development:**
- Use the `setup-env.sh` script to generate secure secrets
- Secrets are stored in environment files
- Never commit `.env` files to version control

**Production:**
- Use Kubernetes secrets or external secret management
- Rotate secrets regularly
- Use strong, unique passwords

### Environment File Security

```bash
# Set proper permissions
chmod 600 frontend/.env.development
chmod 600 backend/.env.development
chmod 600 scripts/.env.database

# Add to .gitignore
echo "*.env" >> .gitignore
echo "!.env.example" >> .gitignore
```

## Configuration Validation

### Automatic Validation

The `setup-env.sh` script automatically validates:
- Required environment variables are set
- Secrets are properly generated
- File permissions are correct
- Configuration consistency

### Manual Validation

```bash
# Check frontend configuration
cd frontend && npm run build

# Check backend configuration
cd backend && go run cmd/mcp/main.go --help

# Check database connection
docker-compose -f scripts/docker-compose.yml exec postgres pg_isready -U postgres
```

## Troubleshooting

### Common Issues

**1. Environment files not found:**
```bash
# Solution: Run setup script
make setup-env
```

**2. Invalid environment variables:**
```bash
# Check file syntax
cat frontend/.env.development | grep -v "^#"

# Validate with application
cd frontend && npm run dev
```

**3. Database connection issues:**
```bash
# Check database environment
cat scripts/.env.database

# Test connection
docker-compose -f scripts/docker-compose.yml exec postgres psql -U postgres -d project_management
```

**4. Build failures:**
```bash
# Check build arguments
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t frontend-test frontend/

# Check environment variables
docker run --env-file frontend/.env.development frontend-test env | grep VITE_
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Frontend debug
VITE_ENABLE_DEBUG=true npm run dev

# Backend debug
LOG_LEVEL=debug go run cmd/mcp/main.go

# Database debug
POSTGRES_LOG_STATEMENT=all docker-compose up postgres
```

## Best Practices

### 1. Environment Separation
- Use different files for different environments
- Never mix development and production configurations
- Use environment-specific secrets

### 2. Secret Management
- Generate strong, unique secrets
- Rotate secrets regularly
- Use external secret management in production

### 3. Configuration Validation
- Validate configurations before deployment
- Use configuration management tools
- Monitor configuration changes

### 4. Documentation
- Document all environment variables
- Keep configuration examples updated
- Provide troubleshooting guides

## Migration Guide

### From Hardcoded Values

If you're migrating from hardcoded configuration:

1. **Identify hardcoded values:**
   ```bash
   grep -r "localhost:8080" frontend/src/
   grep -r "password" backend/
   ```

2. **Create environment files:**
   ```bash
   make setup-env
   ```

3. **Update code to use environment variables:**
   ```typescript
   // Before
   const API_URL = 'http://localhost:8080';
   
   // After
   const API_URL = import.meta.env.VITE_API_BASE_URL;
   ```

4. **Test configuration:**
   ```bash
   make run-local
   ```

### Between Environments

To migrate between environments:

1. **Copy configuration:**
   ```bash
   cp backend/.env.development backend/.env.staging
   ```

2. **Update environment-specific values:**
   ```bash
   sed -i 's/development/staging/g' backend/.env.staging
   sed -i 's/localhost/staging-api.example.com/g' backend/.env.staging
   ```

3. **Validate and deploy:**
   ```bash
   ENVIRONMENT=staging make run-local
   ```

This environment configuration system provides a robust, secure, and maintainable way to manage application settings across different deployment scenarios.
