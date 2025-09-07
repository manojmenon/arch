# Ansible Deployment Guide

This directory contains Ansible playbooks and roles for deploying the Project Management System to remote Ubuntu servers.

## Prerequisites

1. **Ansible installed on your local machine**
   ```bash
   pip install ansible
   ```

2. **SSH access to target server**
   - SSH key-based authentication recommended
   - User with sudo privileges

3. **Target server requirements**
   - Ubuntu 20.04 or later
   - At least 4GB RAM
   - At least 20GB disk space
   - Internet connectivity

## Quick Start

1. **Copy and configure inventory**
   ```bash
   cp inventory/hosts.ini.example inventory/hosts.ini
   # Edit hosts.ini with your server details
   ```

2. **Copy and configure variables**
   ```bash
   cp vars/vars.yml.example vars/vars.yml
   # Edit vars.yml with your configuration
   ```

3. **Create Ansible vault for secrets**
   ```bash
   ansible-vault create vars/secrets.yml
   ```
   Add the following content:
   ```yaml
   db_password: "your-secure-database-password"
   jwt_secret: "your-jwt-secret-key"
   ```

4. **Run deployment**
   ```bash
   ansible-playbook -i inventory/hosts.ini playbooks/site.yml --ask-vault-pass
   ```

## Inventory Configuration

Edit `inventory/hosts.ini` with your server details:

```ini
[project_servers]
your-server ansible_host=192.168.1.100 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[project_servers:vars]
ansible_python_interpreter=/usr/bin/python3
```

## Variables Configuration

Edit `vars/vars.yml` with your application settings:

```yaml
app_name: "project-management"
app_version: "1.0.0"
docker_registry: "localhost:5000"
# ... other variables
```

## Security Best Practices

1. **Use Ansible Vault for secrets**
   ```bash
   ansible-vault encrypt vars/secrets.yml
   ```

2. **Secure SSH access**
   - Use SSH keys instead of passwords
   - Disable root login
   - Use non-standard SSH port

3. **Firewall configuration**
   - Only open necessary ports
   - Use fail2ban for additional protection

## Deployment Roles

### common
- Installs essential packages
- Creates application user and directories
- Configures firewall
- Sets up log rotation

### docker
- Installs Docker and Docker Compose
- Configures Docker daemon
- Creates application network
- Sets up local registry

### kind
- Installs kind and kubectl
- Creates Kubernetes cluster
- Configures cluster networking
- Creates application namespace

### cilium
- Installs Helm
- Deploys Cilium CNI
- Enables Hubble observability
- Sets up port forwarding

### deploy-apps
- Builds Docker images
- Loads images into cluster
- Applies Kubernetes manifests
- Seeds database

### verify
- Checks pod and service status
- Runs health checks
- Performs smoke tests
- Generates deployment report

## Troubleshooting

### Common Issues

1. **SSH connection failed**
   - Check SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
   - Verify server accessibility: `ssh user@server`

2. **Docker build failed**
   - Check available disk space
   - Verify Docker daemon is running

3. **Kubernetes pods not starting**
   - Check pod logs: `kubectl logs -n project-management <pod-name>`
   - Verify resource limits

4. **Database connection failed**
   - Check PostgreSQL pod status
   - Verify database credentials

### Useful Commands

```bash
# Check cluster status
kubectl get nodes

# Check pod status
kubectl get pods -n project-management

# Check service status
kubectl get services -n project-management

# View pod logs
kubectl logs -n project-management <pod-name>

# Access pod shell
kubectl exec -it -n project-management <pod-name> -- /bin/bash
```

## Post-Deployment

After successful deployment:

1. **Access the application**
   - Frontend: http://your-server:3000
   - Backend API: http://your-server:8080
   - API Documentation: http://your-server:8080/swagger/index.html
   - Hubble UI: http://your-server:12000

2. **Default credentials**
   - Username: admin
   - Password: admin123

3. **Monitor the system**
   - Check pod health: `kubectl get pods -n project-management`
   - View logs: `kubectl logs -n project-management <pod-name>`
   - Monitor resources: `kubectl top pods -n project-management`

## Cleanup

To remove the deployment:

```bash
# Delete Kubernetes resources
kubectl delete namespace project-management

# Delete kind cluster
kind delete cluster --name kind-hello-01

# Remove Docker images
docker rmi $(docker images -q)
```

