# Enterprise Project Management System

A full-stack enterprise-ready system with React frontend, Go backend services, PostgreSQL database, and Kubernetes deployment with Ansible automation.

## Architecture

- **Frontend**: React + TypeScript + Vite with Tailwind CSS
- **Backend**: Go services (auth, projects, mcp) with Gin, sqlc+pgx, Casbin RBAC
- **Database**: PostgreSQL 15 with containerized deployment
- **Deployment**: Kubernetes with kind cluster, Cilium CNI, Ansible automation
- **Observability**: OpenTelemetry with OTLP export
- **Security**: RBAC with 5 roles, JWT tokens with 4-hour expiration

## Quick Start

### Local Development

```bash
# Set up environment files with secure secrets
make setup-env

# Start local development environment
make run-local

# Seed database with 100 dummy projects
make seed

# Run tests
make test
```

> **Note:** The `make setup-env` command automatically generates secure secrets and creates environment files for all components. See [ENVIRONMENT.md](ENVIRONMENT.md) for detailed configuration options.

### Kubernetes Deployment

```bash
# Create kind cluster with Cilium
make kind-deploy

# Deploy applications to cluster
kubectl apply -f infra/k8s/
```

### Remote Deployment with Ansible

```bash
# Deploy to remote Ubuntu server
make ansible-deploy
```

## RBAC Roles

1. **superuser** - Full system access
2. **sysadmin** - System administration
3. **localadmin** - Local administration
4. **user** - Standard user access
5. **guest** - Limited read-only access

## API Token Management

- Generate API tokens with 4-hour expiration
- Export tokens for external API access
- Revoke tokens as needed
- All tokens stored securely with proper expiration

## Project Structure

```
├─ frontend/                      # React + TypeScript + Vite
├─ backend/                       # Go services (auth, projects, mcp)
├─ infra/                         # Kubernetes, kind, Ansible
├─ scripts/                       # Database seeding and utilities
├─ openapi/                       # OpenAPI v3.0 specifications
├─ security-observations/         # Security findings and remediation
├─ docs/                          # Architecture and deployment docs
└─ ansible/                       # Ansible playbooks and roles
```

## Development Commands

- `make setup-env` - Set up environment files with secure secrets
- `make build` - Build all components
- `make run-local` - Start local development environment
- `make seed` - Seed database with dummy data
- `make kind-deploy` - Deploy to kind cluster
- `make ansible-deploy` - Deploy to remote server
- `make test` - Run all tests
- `make clean` - Clean build artifacts

## Security

- All passwords hashed with argon2id
- JWT tokens with 4-hour expiration
- RBAC enforcement on all endpoints
- Security observations logged to `security-observations/`
- Input validation and parameterized queries

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Environment Configuration](ENVIRONMENT.md)
- [Security Observations](security-observations/README.md)

