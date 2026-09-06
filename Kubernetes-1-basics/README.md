# ShopSphere — Kubernetes (Basics v1)

**Status: implemented.** First Kubernetes deployment of the ShopSphere e-commerce app.

This version documents the **conversion from Docker Compose to Kubernetes**, introducing container orchestration patterns and self-healing capabilities.

```
Kubernetes-1-basics/
├── Kubernetes/           Raw K8s manifests (namespace, configmaps, secrets, deployments, services)
├── backend/              Same Express app (containerized)
└── frontend/             Same React + Vite app (containerized)
```

## What Changed from Docker Compose

| Aspect | Docker Compose | Kubernetes v1 |
|---|---|---|
| **Orchestration** | Single host (docker-compose up) | Multi-node cluster (kubeadm/minikube/EKS/AKS) |
| **Service Discovery** | Internal Docker DNS (db:3306) | Kubernetes DNS (mysql.shopsphere.svc.cluster.local) |
| **Storage** | Volumes with driver defaults | PersistentVolume + PersistentVolumeClaim |
| **Secrets** | .env files | K8s Secrets (base64-encoded) |
| **Config** | Environment variables in compose | ConfigMaps for config, Secrets for credentials |
| **DB Init** | Embedded in backend startup | initContainer (wait-for-db pattern) |
| **Scaling** | Horizontal via docker-compose replicas | Replicas in Deployment spec |
| **Self-Healing** | Manual restart | Deployment controller monitors/restarts pods |
| **Networking** | Compose network | ClusterIP services, NetworkPolicies |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Kubernetes Cluster                        │
│  (shopsphere namespace)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐    ┌────────────────┐   ┌────────────┐ │
│  │ Frontend Pod   │    │ Backend Pod     │   │ MySQL Pod  │ │
│  │ (nginx/Vite)   │───→│ (Express API)  │──→│ (MySQL 8.0)│ │
│  │ :80            │    │ :5000          │   │ :3306      │ │
│  └────────────────┘    └────────────────┘   └────────────┘ │
│         ↑                     ↑                     ↑        │
│  frontend-svc         backend-svc           mysql-svc       │
│  (ClusterIP)          (ClusterIP)           (ClusterIP)     │
│                                                              │
│  ConfigMaps: shopsphere-config                              │
│  Secrets: shopsphere-secrets                                │
│  PersistentVolumeClaim: mysql-pvc                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Kubernetes cluster** (minikube, kind, or cloud: EKS/AKS/GKE)
- **kubectl** configured and pointing to your cluster
- **Docker images** pushed to a registry (or use local images with minikube)
  - `princewillopah/shopshere-node-backend:1.2`
  - `princewillopah/shopsphere-frontend:1.0`

## Deploy

### Step 1: Create Namespace
```bash
kubectl apply -f Kubernetes/namespace.yaml
```

### Step 2: Create Secrets
```bash
kubectl apply -f Kubernetes/secrets.yaml
```
**Note**: This contains base64-encoded credentials (DB user/pass, JWT secret, S3 keys). Replace values in the YAML before applying.

### Step 3: Create ConfigMaps
```bash
kubectl apply -f Kubernetes/configmaps.yaml
```

### Step 4: Deploy Database (MySQL)
```bash
kubectl apply -f Kubernetes/mysql-pvc.yaml
kubectl apply -f Kubernetes/mysql-deployment.yaml
kubectl apply -f Kubernetes/mysql-service.yaml
```

**Verify MySQL is running:**
```bash
kubectl get pods -n shopsphere | grep mysql
kubectl logs -n shopsphere -l app=mysql --tail=20
```

### Step 5: Deploy Backend (Express API)
```bash
kubectl apply -f Kubernetes/backend-deployment.yaml
kubectl apply -f Kubernetes/backend-service.yaml
```

**The deployment includes an initContainer** that waits for MySQL to be ready before starting the backend pod.

**Verify backend is running:**
```bash
kubectl get pods -n shopsphere | grep backend
kubectl logs -n shopsphere -l app=backend --tail=20
```

### Step 6: Deploy Frontend (React + Vite)
```bash
kubectl apply -f Kubernetes/frontend-deployment.yaml
kubectl apply -f Kubernetes/frontend-service.yaml
```

**Verify frontend is running:**
```bash
kubectl get pods -n shopsphere | grep frontend
```

## Access the Application

### Via Port-Forward (local development)
```bash
# Frontend (http://localhost:3000)
kubectl port-forward -n shopsphere svc/frontend-svc 3000:80 &

# Backend API (http://localhost:5000)
kubectl port-forward -n shopsphere svc/backend-svc 5000:5000 &
```

### Via LoadBalancer (cloud clusters)
If your cluster supports LoadBalancer service type, edit frontend-service.yaml to change `type: ClusterIP` to `type: LoadBalancer`, then:
```bash
kubectl get svc -n shopsphere
# External-IP will appear (cloud) or stay <pending> (minikube)
```

## Manifest Files Overview

| File | Purpose |
|---|---|
| `namespace.yaml` | Creates `shopsphere` namespace for isolation |
| `secrets.yaml` | Base64-encoded: DB credentials, JWT secret, AWS S3 keys |
| `configmaps.yaml` | Non-sensitive config: DB host/port, app environment, S3 bucket |
| `mysql-pvc.yaml` | PersistentVolumeClaim (10Gi by default) for MySQL data |
| `mysql-deployment.yaml` | MySQL 8.0 deployment with 1 replica |
| `mysql-service.yaml` | ClusterIP service for MySQL (headless optional) |
| `backend-deployment.yaml` | Express backend with initContainer (wait-for-db), 1 replica |
| `backend-service.yaml` | ClusterIP service for backend API |
| `frontend-deployment.yaml` | React/Vite frontend with nginx, 1 replica |
| `frontend-service.yaml` | ClusterIP service for frontend (or LoadBalancer) |

## Key Patterns

### 1. InitContainer (Wait-for-DB)
Both backend and frontend use an `initContainer` to wait for MySQL to be ready:
```yaml
initContainers:
- name: wait-for-db
  image: mysql:8.0
  command: ['sh', '-c', 'until mysqladmin ping -h $DB_HOST -P $DB_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD; do echo waiting for db; sleep 2; done']
  env:
  - name: DB_HOST
    valueFrom: { configMapKeyRef: { name: shopsphere-config, key: DB_HOST } }
  # ... more env vars from ConfigMap/Secrets
```
**Why**: Ensures the pod doesn't fail on startup if MySQL isn't ready yet.

### 2. ConfigMap + Secrets Pattern
Configuration split into two:
- **ConfigMap**: Non-sensitive values (DB host, API endpoints, S3 bucket name)
- **Secrets**: Sensitive values (passwords, JWT secret, API keys)

Pods reference both via `valueFrom`:
```yaml
env:
- name: DB_PASSWORD
  valueFrom: { secretKeyRef: { name: shopsphere-secrets, key: MYSQL_PASSWORD } }
```

### 3. PersistentVolumeClaim
MySQL data survives pod restarts:
```yaml
volumes:
- name: mysql-storage
  persistentVolumeClaim:
    claimName: mysql-pvc
```

## Limitations of This Version

1. **Flat manifest structure**: All files in Kubernetes/ directory (hard to scale/maintain)
2. **DB migrations embedded**: Backend deployment logic handles migrations (not idempotent)
3. **Single ConfigMap/Secrets**: All config in one place (no separation by concern)
4. **No Jobs for initialization**: Database migrations run as part of deployment
5. **Single replica**: No horizontal scaling demonstrated
6. **No ingress**: Frontend accessed via port-forward or LoadBalancer only

## Next Steps → v2 (Kubernetes-2-basics-v2)

See [Kubernetes-2-basics-v2/README.md](../Kubernetes-2-basics-v2/README.md) for improvements:
- Organized directory structure (database/, backend/, frontend/, Jobs/, configmaps/, secrets/)
- Explicit K8s Jobs for DB migrations and seeding
- Better secret/config organization
- Production-ready patterns

## Troubleshooting

### Pod stuck in `CrashLoopBackOff`
```bash
kubectl describe pod -n shopsphere <pod-name>
kubectl logs -n shopsphere <pod-name> --previous
```
Usually: initContainer failed (DB not ready), missing config, or app error.

### Database pod not starting
```bash
kubectl logs -n shopsphere -l app=mysql
kubectl describe pod -n shopsphere -l app=mysql
```
Check: PVC bound? Enough disk space? Permissions?

### Backend can't connect to DB
```bash
# Verify MySQL service DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup mysql.shopsphere.svc.cluster.local
```

### Frontend can't reach backend
Ensure `VITE_API_URL` in frontend ConfigMap points to backend service:
```yaml
VITE_API_URL: "http://backend-svc:5000"
```

## Related Files

- [Docker-version/README.md](../Docker-version/README.md) — Docker Compose setup
- [Kubernetes-2-basics-v2/README.md](../Kubernetes-2-basics-v2/README.md) — Improved K8s patterns
- [backend/README.md](backend/README.md) — Express app documentation
- [frontend/README.md](frontend/README.md) — React app documentation
