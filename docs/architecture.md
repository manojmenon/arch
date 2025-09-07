# Project Management System - Architecture

## Overview

The Project Management System is a full-stack enterprise application designed for managing residential construction projects. It provides a comprehensive solution for project tracking, user management, and API access with robust security and observability features.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Go Backend    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Services)    │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - TypeScript    │    │ - Gin HTTP      │    │ - PostgreSQL 15 │
│ - Vite          │    │ - JWT Auth      │    │ - JSONB Fields  │
│ - Tailwind CSS  │    │ - RBAC          │    │ - UUID Primary  │
│ - Zustand       │    │ - OpenTelemetry │    │   Keys          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Kubernetes    │    │   OpenTelemetry │
│   (Reverse      │    │   (Orchestration│    │   (Observability│
│    Proxy)       │    │    Platform)    │    │    Platform)    │
│                 │    │                 │    │                 │
│ - Static Files  │    │ - Kind Cluster  │    │ - OTLP Export   │
│ - SSL/TLS       │    │ - Cilium CNI    │    │ - Trace/Metrics │
│ - Load Balancing│    │ - Helm Charts   │    │ - Logging       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Details

### Frontend (React SPA)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- React Query for API state management

**Key Features:**
- Responsive design with mobile support
- Real-time project updates
- Role-based UI components
- API token management interface
- JSON editor for project metadata
- Admin console for user management

**Security Features:**
- Client-side route protection
- Secure token storage
- XSS protection
- CSRF protection via SameSite cookies

### Backend Services (Go)

**Technology Stack:**
- Go 1.21+
- Gin HTTP framework
- PostgreSQL with pgx driver
- JWT for authentication
- Casbin for RBAC
- OpenTelemetry for observability
- Zap for structured logging

**Service Architecture:**
- **Auth Service**: User authentication, session management, API token generation
- **Projects Service**: CRUD operations for residential projects
- **MCP Server**: Management Control Proxy that aggregates all services

**Security Features:**
- Argon2id password hashing
- JWT token validation
- RBAC enforcement
- Input validation and sanitization
- SQL injection prevention
- Rate limiting (configurable)

### Database (PostgreSQL 15)

**Schema Design:**
- UUID primary keys for all entities
- JSONB fields for flexible metadata storage
- Proper indexing for performance
- Foreign key constraints for data integrity
- Audit trails with created_at/updated_at timestamps

**Key Tables:**
- `users`: User accounts with role-based access
- `projects`: Residential project information
- `api_tokens`: API access tokens with expiration

**Security Features:**
- Encrypted connections (SSL/TLS)
- Role-based database access
- Parameterized queries
- Connection pooling
- Backup and recovery procedures

### Infrastructure

**Containerization:**
- Docker containers for all services
- Multi-stage builds for optimization
- Security scanning in CI/CD
- Non-root user execution

**Orchestration:**
- Kubernetes with Kind for local development
- Cilium CNI for advanced networking
- Helm charts for deployment
- Persistent volumes for data storage

**Observability:**
- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Prometheus metrics collection
- Health check endpoints

## Security Architecture

### Authentication & Authorization

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Backend   │    │  Database   │
│             │    │             │    │             │
│ 1. Login    │───►│ 2. Validate │───►│ 3. Check    │
│    Request  │    │    Creds    │    │    User     │
│             │    │             │    │             │
│ 4. Store    │◄───│ 5. Generate │◄───│ 6. Return   │
│    JWT      │    │    JWT      │    │    User     │
│             │    │             │    │             │
│ 7. API      │───►│ 8. Validate │───►│ 9. Check    │
│    Request  │    │    JWT      │    │    Perms    │
│             │    │             │    │             │
│ 10. Process │◄───│ 11. Execute │◄───│ 12. Return  │
│     Response│    │    Request  │    │    Data     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
1. **superuser** - Full system access
2. **sysadmin** - System administration
3. **localadmin** - Local administration
4. **user** - Standard user access
5. **guest** - Limited read-only access

**Permission Matrix:**
| Permission | superuser | sysadmin | localadmin | user | guest |
|------------|-----------|----------|------------|------|-------|
| projects:view | ✓ | ✓ | ✓ | ✓ | ✓ |
| projects:create | ✓ | ✓ | ✓ | ✗ | ✗ |
| projects:manage | ✓ | ✓ | ✓ | ✗ | ✗ |
| users:view | ✓ | ✓ | ✓ | ✗ | ✗ |
| users:manage | ✓ | ✓ | ✗ | ✗ | ✗ |
| tokens:manage | ✓ | ✓ | ✓ | ✓ | ✗ |
| system:configure | ✓ | ✓ | ✗ | ✗ | ✗ |

## Data Flow

### Project Creation Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │    │  Audit Log  │
│             │    │             │    │             │    │             │
│ 1. Form     │───►│ 2. Validate │───►│ 3. Insert   │───►│ 4. Log      │
│    Submit   │    │    Input    │    │    Project  │    │    Action   │
│             │    │             │    │             │    │             │
│ 5. Update   │◄───│ 6. Return   │◄───│ 7. Return   │◄───│ 8. Confirm  │
│    UI       │    │    Project  │    │    Data     │    │    Logged   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### API Token Generation Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │    │  Security   │
│             │    │             │    │             │    │   Log       │
│ 1. Request  │───►│ 2. Validate │───►│ 3. Generate │───►│ 4. Log      │
│    Token    │    │    User     │    │    Token    │    │    Event    │
│             │    │             │    │             │    │             │
│ 5. Display  │◄───│ 6. Return   │◄───│ 7. Store    │◄───│ 8. Confirm  │
│    Token    │    │    Token    │    │    Token    │    │    Logged   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Deployment Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Backend   │  │ PostgreSQL  │        │
│  │   :3000     │  │   :8080     │  │   :5432     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐                                          │
│  │ OpenTelemetry│                                         │
│  │ Collector   │                                          │
│  │   :4318     │                                          │
│  └─────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### Production (Kubernetes)

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Backend   │  │ PostgreSQL  │        │
│  │   Pods      │  │   Pods      │  │ StatefulSet │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Ingress   │  │   Services  │  │   Secrets   │        │
│  │ Controller  │  │   (ClusterIP)│  │   (Vault)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ OpenTelemetry│  │   Cilium   │  │ Persistent  │        │
│  │ Collector   │  │     CNI     │  │  Volumes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

### Frontend Performance
- Code splitting with Vite
- Lazy loading of routes
- Image optimization
- Bundle size optimization
- CDN for static assets

### Backend Performance
- Connection pooling for database
- Query optimization with indexes
- Caching strategies
- Horizontal scaling with Kubernetes
- Load balancing

### Database Performance
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for scaling
- Partitioning for large tables

## Scalability

### Horizontal Scaling
- Stateless backend services
- Kubernetes auto-scaling
- Load balancer distribution
- Database read replicas

### Vertical Scaling
- Resource limits and requests
- CPU and memory optimization
- Database tuning
- Cache optimization

## Monitoring and Observability

### Metrics
- Application metrics (Prometheus)
- Infrastructure metrics (Node Exporter)
- Custom business metrics
- Performance metrics

### Logging
- Structured logging (JSON)
- Correlation IDs
- Log aggregation
- Log retention policies

### Tracing
- Distributed tracing (OpenTelemetry)
- Request flow visualization
- Performance bottleneck identification
- Error tracking

## Security Considerations

### Network Security
- TLS encryption in transit
- Network policies
- Firewall rules
- VPN access for admin

### Application Security
- Input validation
- Output encoding
- Authentication and authorization
- Session management

### Infrastructure Security
- Container security scanning
- Non-root containers
- Secret management
- Regular security updates

## Disaster Recovery

### Backup Strategy
- Database backups (daily)
- Configuration backups
- Code repository backups
- Disaster recovery testing

### High Availability
- Multi-zone deployment
- Database clustering
- Load balancer redundancy
- Health check monitoring

## Compliance

### Data Protection
- GDPR compliance
- Data encryption
- Data retention policies
- Privacy controls

### Security Standards
- OWASP compliance
- Security scanning
- Penetration testing
- Security audits

