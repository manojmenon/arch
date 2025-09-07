# Project Management System - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Project Management System in various environments, from local development to production.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- 4GB RAM
- 20GB disk space
- 2 CPU cores
- Internet connectivity

**Recommended Requirements:**
- 8GB RAM
- 50GB disk space
- 4 CPU cores
- SSD storage

### Software Dependencies

**Required:**
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- curl/wget

**For Kubernetes Deployment:**
- kubectl 1.28+
- kind 0.20+
- Helm 3.12+

**For Ansible Deployment:**
- Ansible 2.14+
- Python 3.8+
- SSH access to target servers

## Local Development Deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management-system
   ```

2. **Start the development environment**
   ```bash
   make run-local
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger/index.html

### Manual Setup

1. **Start PostgreSQL and OpenTelemetry Collector**
   ```bash
   docker-compose -f scripts/docker-compose.yml up -d postgres otel-collector
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec postgres psql -U postgres -d project_management -f /docker-entrypoint-initdb.d/001_initial_schema.sql
   docker-compose exec postgres psql -U postgres -d project_management -f /docker-entrypoint-initdb.d/002_seed_data.sql
   ```

3. **Seed the database**
   ```bash
   cd scripts
   go mod tidy
   go run seed_projects.go
   ```

4. **Start the backend services**
   ```bash
   cd backend
   go mod tidy
   go run cmd/mcp/main.go
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Default Credentials

- **Username:** admin
- **Password:** admin123

## Kubernetes Deployment (Kind)

### Prerequisites

1. **Install kind and kubectl**
   ```bash
   # Install kind
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind

   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl
   sudo mv kubectl /usr/local/bin/
   ```

2. **Install Helm**
   ```bash
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

### Deployment Steps

1. **Create the kind cluster**
   ```bash
   make kind-deploy
   ```

2. **Build and load Docker images**
   ```bash
   # Build images
   docker build -t project-management-backend:latest backend/
   docker build -t project-management-frontend:latest frontend/

   # Load images into kind
   kind load docker-image project-management-backend:latest --name kind-hello-01
   kind load docker-image project-management-frontend:latest --name kind-hello-01
   ```

3. **Deploy the application**
   ```bash
   kubectl apply -f infra/k8s/
   ```

4. **Verify deployment**
   ```bash
   kubectl get pods -n project-management
   kubectl get services -n project-management
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Hubble UI: http://localhost:12000

### Troubleshooting

**Check pod status:**
```bash
kubectl describe pod <pod-name> -n project-management
```

**View pod logs:**
```bash
kubectl logs <pod-name> -n project-management
```

**Check service endpoints:**
```bash
kubectl get endpoints -n project-management
```

## Ansible Deployment (Remote Ubuntu)

### Prerequisites

1. **Install Ansible**
   ```bash
   pip install ansible
   ```

2. **Prepare inventory**
   ```bash
   cp ansible/inventory/hosts.ini.example ansible/inventory/hosts.ini
   # Edit hosts.ini with your server details
   ```

3. **Create secrets vault**
   ```bash
   ansible-vault create ansible/vars/secrets.yml
   ```
   Add the following content:
   ```yaml
   db_password: "your-secure-database-password"
   jwt_secret: "your-jwt-secret-key"
   ```

### Deployment Steps

1. **Run the deployment**
   ```bash
   ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --ask-vault-pass
   ```

2. **Monitor deployment progress**
   ```bash
   # Check deployment status
   ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --check

   # Run specific roles
   ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/site.yml --tags "docker,kind"
   ```

3. **Verify deployment**
   ```bash
   # Check cluster status
   ssh user@server "kubectl get nodes"

   # Check application pods
   ssh user@server "kubectl get pods -n project-management"
   ```

### Post-Deployment

1. **Access the application**
   - Frontend: http://your-server:3000
   - Backend API: http://your-server:8080
   - API Documentation: http://your-server:8080/swagger/index.html
   - Hubble UI: http://your-server:12000

2. **Check deployment report**
   ```bash
   ssh user@server "cat /opt/project-management/deployment-report.txt"
   ```

## Production Deployment

### Environment Preparation

1. **Set up production environment**
   ```bash
   # Create production namespace
   kubectl create namespace project-management-prod

   # Create production secrets
   kubectl create secret generic app-secrets \
     --from-literal=DB_PASSWORD=your-secure-password \
     --from-literal=JWT_SECRET=your-jwt-secret \
     -n project-management-prod
   ```

2. **Configure production values**
   ```yaml
   # production-values.yaml
   environment: production
   replicas: 3
   resources:
     limits:
       memory: "1Gi"
       cpu: "1000m"
     requests:
       memory: "512Mi"
       cpu: "500m"
   ```

### Deployment

1. **Deploy with production configuration**
   ```bash
   helm install project-management ./helm-chart \
     --namespace project-management-prod \
     --values production-values.yaml
   ```

2. **Set up monitoring**
   ```bash
   # Deploy Prometheus and Grafana
   helm install prometheus prometheus-community/kube-prometheus-stack \
     --namespace monitoring
   ```

3. **Configure ingress**
   ```bash
   # Deploy ingress controller
   helm install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx
   ```

## Configuration Management

### Environment Variables

**Required Variables:**
```bash
# Database
DB_HOST=postgres-service
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=project_management

# JWT
JWT_SECRET=your-jwt-secret

# OpenTelemetry
OTEL_ENDPOINT=http://otel-collector:4318/v1/traces
OTEL_ENABLED=true
```

**Optional Variables:**
```bash
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
ENVIRONMENT=production

# RBAC
RBAC_MODEL_PATH=/app/rbac_model.conf
RBAC_POLICY_PATH=/app/rbac_policy.csv
```

### Secrets Management

**Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
```

**Ansible Vault:**
```bash
# Encrypt secrets
ansible-vault encrypt ansible/vars/secrets.yml

# Use in playbooks
ansible-playbook playbook.yml --ask-vault-pass
```

## Monitoring and Maintenance

### Health Checks

**Application Health:**
```bash
# Check backend health
curl http://localhost:8080/health

# Check database connectivity
kubectl exec -it postgres-0 -n project-management -- pg_isready -U postgres
```

**Kubernetes Health:**
```bash
# Check pod status
kubectl get pods -n project-management

# Check service endpoints
kubectl get endpoints -n project-management

# Check resource usage
kubectl top pods -n project-management
```

### Logging

**View Application Logs:**
```bash
# Backend logs
kubectl logs -f deployment/backend -n project-management

# Frontend logs
kubectl logs -f deployment/frontend -n project-management

# Database logs
kubectl logs -f statefulset/postgres -n project-management
```

**Log Aggregation:**
```bash
# Deploy ELK stack
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install logstash elastic/logstash
```

### Backup and Recovery

**Database Backup:**
```bash
# Create backup
kubectl exec -it postgres-0 -n project-management -- \
  pg_dump -U postgres project_management > backup.sql

# Restore backup
kubectl exec -i postgres-0 -n project-management -- \
  psql -U postgres project_management < backup.sql
```

**Configuration Backup:**
```bash
# Backup Kubernetes resources
kubectl get all -n project-management -o yaml > k8s-backup.yaml

# Backup secrets
kubectl get secrets -n project-management -o yaml > secrets-backup.yaml
```

## Troubleshooting

### Common Issues

**1. Pods not starting:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n project-management

# Check resource limits
kubectl top nodes
kubectl top pods -n project-management
```

**2. Database connection issues:**
```bash
# Check database status
kubectl exec -it postgres-0 -n project-management -- pg_isready -U postgres

# Check database logs
kubectl logs postgres-0 -n project-management
```

**3. Service connectivity issues:**
```bash
# Check service endpoints
kubectl get endpoints -n project-management

# Test service connectivity
kubectl exec -it <pod-name> -n project-management -- curl http://backend-service:8080/health
```

**4. Authentication issues:**
```bash
# Check JWT secret
kubectl get secret app-secrets -n project-management -o yaml

# Verify token validation
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/auth/me
```

### Performance Issues

**1. High memory usage:**
```bash
# Check memory usage
kubectl top pods -n project-management

# Adjust resource limits
kubectl patch deployment backend -n project-management -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

**2. Slow database queries:**
```bash
# Check database performance
kubectl exec -it postgres-0 -n project-management -- \
  psql -U postgres -d project_management -c "SELECT * FROM pg_stat_activity;"
```

**3. Network latency:**
```bash
# Check network policies
kubectl get networkpolicies -n project-management

# Test network connectivity
kubectl exec -it <pod-name> -n project-management -- ping postgres-service
```

## Security Considerations

### Network Security

**1. Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: project-management-netpol
  namespace: project-management
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: project-management
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: project-management
```

**2. TLS Configuration:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
```

### Application Security

**1. Security Context:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
    - ALL
```

**2. Resource Limits:**
```yaml
resources:
  limits:
    memory: "512Mi"
    cpu: "500m"
  requests:
    memory: "256Mi"
    cpu: "250m"
```

## Scaling

### Horizontal Scaling

**1. Auto-scaling:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**2. Database Scaling:**
```yaml
# Read replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-read-replica
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_REPLICATION_MODE
          value: "slave"
```

### Vertical Scaling

**1. Resource Adjustment:**
```bash
# Increase memory limits
kubectl patch deployment backend -n project-management -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

**2. Database Tuning:**
```bash
# Update PostgreSQL configuration
kubectl exec -it postgres-0 -n project-management -- \
  psql -U postgres -d project_management -c "ALTER SYSTEM SET shared_buffers = '256MB';"
```

## Maintenance

### Regular Maintenance Tasks

**1. Database Maintenance:**
```bash
# Vacuum and analyze
kubectl exec -it postgres-0 -n project-management -- \
  psql -U postgres -d project_management -c "VACUUM ANALYZE;"

# Clean up expired tokens
kubectl exec -it postgres-0 -n project-management -- \
  psql -U postgres -d project_management -c "DELETE FROM api_tokens WHERE expires_at < NOW() - INTERVAL '30 days';"
```

**2. Log Rotation:**
```bash
# Set up log rotation
kubectl create configmap logrotate-config --from-file=logrotate.conf -n project-management
```

**3. Security Updates:**
```bash
# Update base images
docker pull postgres:15-alpine
docker pull nginx:alpine

# Rebuild and redeploy
make build
kubectl rollout restart deployment/backend -n project-management
kubectl rollout restart deployment/frontend -n project-management
```

### Monitoring and Alerting

**1. Prometheus Alerts:**
```yaml
groups:
- name: project-management
  rules:
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
```

**2. Health Check Monitoring:**
```bash
# Set up health check monitoring
kubectl create configmap health-check-config --from-file=health-check.sh -n project-management
```

This deployment guide provides comprehensive instructions for deploying the Project Management System in various environments. Follow the appropriate section based on your deployment needs and environment requirements.

