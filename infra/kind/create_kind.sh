#!/bin/bash

# Kind cluster creation script with Cilium CNI
set -e

CLUSTER_NAME="kind-hello-01"
CILIUM_VERSION="1.14.5"

echo "Checking for existing kind cluster..."

# Check if cluster already exists
if kind get clusters | grep -q "$CLUSTER_NAME"; then
    echo "Cluster $CLUSTER_NAME already exists. Reusing existing cluster..."
    
    # Check if Cilium is installed
    if kubectl get pods -n kube-system | grep -q cilium; then
        echo "Cilium is already installed in the cluster."
    else
        echo "Installing Cilium in existing cluster..."
        install_cilium
    fi
else
    echo "Creating new kind cluster: $CLUSTER_NAME"
    create_cluster
    install_cilium
fi

# Wait for cluster to be ready
echo "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

echo "Cluster setup complete!"
echo "Cluster name: $CLUSTER_NAME"
echo "Nodes:"
kubectl get nodes

function create_cluster() {
    # Create kind cluster configuration
    cat > kind-config.yaml << EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: $CLUSTER_NAME
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
networking:
  disableDefaultCNI: true
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"
EOF

    # Create the cluster
    kind create cluster --config kind-config.yaml
    
    # Clean up config file
    rm kind-config.yaml
}

function install_cilium() {
    echo "Installing Cilium CNI..."
    
    # Install Cilium using Helm
    helm repo add cilium https://helm.cilium.io/
    helm repo update
    
    # Install Cilium with Hubble enabled
    helm install cilium cilium/cilium \
        --version $CILIUM_VERSION \
        --namespace kube-system \
        --set hubble.relay.enabled=true \
        --set hubble.ui.enabled=true \
        --set hubble.metrics.enabled="{dns,drop,tcp,flow,port-distribution,icmp,http}" \
        --set prometheus.enabled=true \
        --set operator.prometheus.enabled=true \
        --set hubble.relay.prometheus.enabled=true
    
    # Wait for Cilium to be ready
    echo "Waiting for Cilium to be ready..."
    kubectl wait --for=condition=Ready pods -l k8s-app=cilium -n kube-system --timeout=300s
    
    echo "Cilium installation complete!"
    echo "Hubble UI will be available at: http://localhost:12000"
}

# Set up port forwarding for Hubble UI
echo "Setting up port forwarding for Hubble UI..."
kubectl port-forward -n kube-system svc/hubble-ui 12000:80 &
HUBBLE_PID=$!

echo "Hubble UI port forwarding started (PID: $HUBBLE_PID)"
echo "Access Hubble UI at: http://localhost:12000"

# Create namespace for our application
echo "Creating application namespace..."
kubectl create namespace project-management --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "Kind cluster setup complete!"
echo "Cluster: $CLUSTER_NAME"
echo "Namespace: project-management"
echo "Hubble UI: http://localhost:12000"
echo ""
echo "To stop Hubble port forwarding, run: kill $HUBBLE_PID"

