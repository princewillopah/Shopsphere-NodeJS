# ShopSphere — Kubernetes (Basics v2 - Production Ready)

**Status: implemented.** Production-ready Kubernetes deployment with organized structure and explicit initialization patterns.

This version improves upon v1 by introducing **organized manifest directories**, **K8s Jobs for database initialization**, and **better secret/config management**.

```
Kubernetes-2-basics-v2/
├── Kubernetes/
│   ├── namespace.yaml                   # shopsphere namespace
│   ├── configmaps/                      # ConfigMaps by concern
│   │   ├── backends.yaml                # Backend app config
│   │   └── frontend.yaml                # Frontend app config
│   ├── secrets/                         # Secrets by concern
│   │   ├── backend.yaml                 # Backend secrets (DB, JWT, S3)
│   │   └── aws-s3.yaml                  # AWS S3 credentials
│   ├── database/                        # MySQL resources
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── Jobs/                            # K8s Jobs (one-time tasks)
│   │   ├── migrate-job.yaml             # DB migrations
│   │   └── seed-job.yaml                # DB seeding
│   ├── backend/                         # Backend resources
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── frontend/                        # Frontend resources
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── scripts/                         # Deployment helper scripts
├── backend/                             # Same Express app
└── frontend/                            # Same React + Vite app
```

## What's Improved from v1

### 1. **Organized Directory Structure**
v1 had a flat `/Kubernetes/` directory with 10+ files. v2 organizes by resource type:
- Clear separation of concerns (database/, backend/, frontend/)
- Easier to find, modify, and version control individual resources
- Scales well for multi-region or multi-cluster setups
- Kustomization-ready (each folder can be a base)

### 2. **Database Initialization as K8s Jobs** 🎯
**v1 Problem**: Migrations embedded in backend deployment logic (tightly coupled, risky)

**v2 Solution**: Explicit K8s Jobs that run BEFORE backend starts
```
Timeline:
  1. namespace + configmaps + secrets created
  2. MySQL deployment starts
  3. migrate-job runs (waits for DB, runs sequelize migrations)
  4. seed-job runs (waits for migrations, runs seeding)
  5. backend deployment starts (migrations already done, safe to connect)
```

**Benefits**:
- Idempotent: migrations run as a K8s-native pattern (best practice)
- Decoupled: backend doesn't need DB-init logic
- Observable: see migration logs separately
- Retryable: backoffLimit, ttlSecondsAfterFinished (auto-cleanup)

### 3. **Better Secret Organization**
v1: Single `secrets.yaml` with all credentials mixed together

v2: Organized by concern:
- **backend.yaml**: DB credentials, JWT secret, S3 bucket name, node environment
- **aws-s3.yaml**: AWS access key, secret key (easier to rotate independently)

**Why**: Security principle of least privilege; easier to audit and rotate credentials separately.

### 4. **Better ConfigMap Organization**
v1: Single `configmaps.yaml` for everything

v2: Organized by service:
- **backends.yaml**: Backend-specific config (DB host, S3 regions, log levels)
- **frontend.yaml**: Frontend-specific config (API base URL, analytics, feature flags)

**Why**: Clearer dependencies; easier to scale frontend config independently.

## Architecture (v2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Kubernetes Cluster                            │
│                   (shopsphere namespace)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INITIALIZATION PHASE (Jobs)                                        │
│  ┌──────────────────────┐      ┌──────────────────────┐             │
│  │  migrate-job         │  →   │   seed-job           │             │
│  │  (Sequelize migrate) │      │   (DB seeding)       │             │
│  │  backoffLimit: 3     │      │   backoffLimit: 3    │             │
│  │  ttlSecondsAfter: 300       │   depends_on: migrate│             │
│  └──────────────────────┘      └──────────────────────┘             │
│                                          ↓                           │
│  RUNTIME PHASE (Deployments)                                        │
│  ┌────────────────┐    ┌────────────────┐   ┌────────────┐         │
│  │ Frontend Pod   │    │ Backend Pod     │   │ MySQL Pod  │         │
│  │ (nginx/Vite)   │───→│ (Express API)   │──→│ (MySQL 8.0)│         │
│  │ :80            │    │ :5000 (ready!)  │   │ :3306      │         │
│  └────────────────┘    └────────────────┘   └────────────┘         │
│         ↑                     ↑                     ↑                │
│  frontend-svc         backend-svc           mysql-svc               │
│                                                                      │
│  ConfigMaps:                                                        │
│    ├── backends.yaml                                                │
│    └── frontend.yaml                                                │
│  Secrets:                                                           │
│    ├── backend.yaml                                                 │
│    └── aws-s3.yaml                                                  │
│  Storage:                                                           │
│    └── mysql-pvc (10Gi)                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Kubernetes cluster** (minikube, kind, or cloud: EKS/AKS/GKE)
- **kubectl** configured and pointing to your cluster
- **Docker images** pushed to a registry
  - `princewillopah/shopshere-node-backend:1.2`
  - `princewillopah/shopsphere-frontend:1.0`

## Deploy

### Quick Start (One Command)
```bash
# Apply all manifests in order (directory walk respects alphabetical order)
kubectl apply -R -f Kubernetes/
```

**Note**: This works because Kubernetes applies resources in dependency order (namespace first, Jobs after database, etc.). However, for more control, follow the manual steps below.

### Manual Deployment (Recommended for first time)

#### Step 1: Create Namespace & Secrets
```bash
kubectl apply -f Kubernetes/namespace.yaml
kubectl apply -f Kubernetes/secrets/backend.yaml
kubectl apply -f Kubernetes/secrets/aws-s3.yaml
```

**⚠️ Important**: Edit `secrets/backend.yaml` and `secrets/aws-s3.yaml` to replace placeholder values:
```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Then base64-encode for K8s Secret
echo -n "your-jwt-secret-here" | base64
```

#### Step 2: Create ConfigMaps
```bash
kubectl apply -f Kubernetes/configmaps/backends.yaml
kubectl apply -f Kubernetes/configmaps/frontend.yaml
```

#### Step 3: Deploy MySQL
```bash
kubectl apply -f Kubernetes/database/pvc.yaml
kubectl apply -f Kubernetes/database/deployment.yaml
kubectl apply -f Kubernetes/database/service.yaml
```

**Verify MySQL is running:**
```bash
kubectl get pods -n shopsphere -l app=mysql
kubectl logs -n shopsphere -l app=mysql --tail=30
```

**Wait for MySQL to be ready:**
```bash
kubectl wait --for=condition=ready pod -l app=mysql -n shopsphere --timeout=300s
```

#### Step 4: Run Database Initialization Jobs
```bash
kubectl apply -f Kubernetes/Jobs/migrate-job.yaml
kubectl apply -f Kubernetes/Jobs/seed-job.yaml
```

**Monitor job progress:**
```bash
# Watch migrate job
kubectl logs -n shopsphere -f job/backend-migrate

# Watch seed job (only starts after migrate completes)
kubectl logs -n shopsphere -f job/backend-seed

# Check job status
kubectl get jobs -n shopsphere
kubectl describe job backend-migrate -n shopsphere
kubectl describe job backend-seed -n shopsphere
```

**Wait for jobs to complete:**
```bash
kubectl wait --for=condition=complete job/backend-migrate -n shopsphere --timeout=300s
kubectl wait --for=condition=complete job/backend-seed -n shopsphere --timeout=300s
```

**Jobs auto-cleanup** (TTL = 5 minutes, set in spec.ttlSecondsAfterFinished):
```bash
# Before cleanup (pods visible)
kubectl get pods -n shopsphere -l job-name=backend-migrate

# After 5 minutes (pods deleted automatically)
kubectl get pods -n shopsphere -l job-name=backend-migrate  # Empty!
```

#### Step 5: Deploy Backend
```bash
kubectl apply -f Kubernetes/backend/deployment.yaml
kubectl apply -f Kubernetes/backend/service.yaml
```

**Verify backend is running:**
```bash
kubectl get pods -n shopsphere -l app=backend
kubectl logs -n shopsphere -l app=backend --tail=30

# Test health endpoint
kubectl port-forward -n shopsphere svc/backend-svc 5000:5000 &
curl http://localhost:5000/health  # or your health endpoint
```

#### Step 6: Deploy Frontend
```bash
kubectl apply -f Kubernetes/frontend/deployment.yaml
kubectl apply -f Kubernetes/frontend/service.yaml
```

**Verify frontend is running:**
```bash
kubectl get pods -n shopsphere -l app=frontend
kubectl logs -n shopsphere -l app=frontend --tail=30
```

## Access the Application

### Port-Forward (local development)
```bash
# Frontend (http://localhost:3000)
kubectl port-forward -n shopsphere svc/frontend-svc 3000:80 &

# Backend API (http://localhost:5000)
kubectl port-forward -n shopsphere svc/backend-svc 5000:5000 &
```

### LoadBalancer (cloud clusters)
```bash
# Edit frontend service to LoadBalancer type
kubectl patch svc frontend-svc -n shopsphere -p '{"spec":{"type":"LoadBalancer"}}'

# Get external IP
kubectl get svc -n shopsphere frontend-svc
# EXTERNAL-IP will appear (cloud) or stay <pending> (minikube)
```

### NodePort (bare-metal Kubernetes)
```bash
kubectl patch svc frontend-svc -n shopsphere -p '{"spec":{"type":"NodePort"}}'
kubectl get svc -n shopsphere frontend-svc
# Access via <NODE-IP>:<NODE-PORT>
```

## Manifest Files Overview

### Secrets (`secrets/`)

| File | Purpose | Contains |
|---|---|---|
| `backend.yaml` | Backend app credentials | `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `S3_BUCKET`, `NODE_ENV` |
| `aws-s3.yaml` | AWS S3 credentials | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |

**Generate secrets from plaintext:**
```bash
kubectl create secret generic shopsphere-backend \
  --from-literal=DB_USER=shopsphere \
  --from-literal=DB_PASSWORD=StrongPassword123! \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  -n shopsphere --dry-run=client -o yaml | tee secrets/backend.yaml
```

### ConfigMaps (`configmaps/`)

| File | Purpose | Contains |
|---|---|---|
| `backends.yaml` | Backend app config | `DB_HOST`, `DB_PORT`, `S3_REGION`, `LOG_LEVEL` |
| `frontend.yaml` | Frontend app config | `VITE_API_URL`, `ANALYTICS_ID` |

### Database (`database/`)

| File | Purpose |
|---|---|
| `pvc.yaml` | PersistentVolumeClaim (10Gi, persistent storage) |
| `deployment.yaml` | MySQL 8.0 Deployment (1 replica) |
| `service.yaml` | ClusterIP Service (headless optional) |

### Jobs (`Jobs/`)

| File | Purpose | When it runs |
|---|---|---|
| `migrate-job.yaml` | Run DB migrations (npx sequelize-cli db:migrate) | After MySQL ready |
| `seed-job.yaml` | Seed initial data | After migrate-job complete |

**Key Job features:**
- `backoffLimit: 3` — retry max 3 times
- `ttlSecondsAfterFinished: 300` — auto-delete pod after 5 min
- `restartPolicy: Never` — don't restart on failure (backoffLimit handles retries)
- `initContainer` — wait-for-db pattern

### Backend (`backend/`)

| File | Purpose |
|---|---|
| `deployment.yaml` | Express backend Deployment (1 replica, port 5000) |
| `service.yaml` | ClusterIP Service for backend |

**Features:**
- `initContainer` — wait-for-db (healthcheck)
- Mounts ConfigMaps/Secrets as env vars
- Liveness/readiness probes (optional, add for prod)

### Frontend (`frontend/`)

| File | Purpose |
|---|---|
| `deployment.yaml` | React/Vite frontend Deployment (1 replica, port 80) |
| `service.yaml` | ClusterIP Service for frontend |

## Key Patterns & Best Practices

### 1. Job Pattern for DB Initialization
**Problem**: How to run migrations idempotently in Kubernetes?

**Solution**: Use K8s Jobs (not embedded in deployments):
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backend-migrate
spec:
  backoffLimit: 3
  ttlSecondsAfterFinished: 300  # Auto-cleanup
  template:
    spec:
      restartPolicy: Never       # Don't restart on error
      initContainers:
      - name: wait-for-db
        image: mysql:8.0
        command: ['sh', '-c', 'until mysqladmin ping ...; do sleep 2; done']
      containers:
      - name: migrate
        image: princewillopah/shopshere-node-backend:1.2
        command: ["sh", "-c", "npx sequelize-cli db:migrate"]
```

**Why**:
- K8s-native pattern (Jobs are designed for this)
- Idempotent (migrations can re-run safely)
- Observable (see migration logs)
- No coupling to deployment logic

### 2. initContainer for Dependency Waiting
Ensures pods don't fail if dependencies (MySQL, other services) aren't ready:
```yaml
initContainers:
- name: wait-for-db
  image: mysql:8.0
  command: ['sh', '-c', 'until mysqladmin ping -h $DB_HOST -P $DB_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD; do sleep 2; done']
```

### 3. Secret vs ConfigMap Split
- **ConfigMaps**: Non-sensitive data (endpoints, feature flags, log levels)
- **Secrets**: Sensitive data (passwords, API keys, tokens)

**Why**: Audit trail, encryption at rest (if enabled), access control policies.

### 4. Persistent Storage
MySQL data survives pod restarts:
```yaml
volumes:
- name: mysql-storage
  persistentVolumeClaim:
    claimName: mysql-pvc
```

## Deployment Checklist

```
☐ Kubernetes cluster running (kubectl version works)
☐ Docker images pushed to registry (or available locally)
☐ Secrets updated with real values (JWT, DB creds, S3 keys)
☐ ConfigMaps updated with correct endpoints (backend host, frontend API URL)
☐ Apply namespace
☐ Apply secrets
☐ Apply configmaps
☐ Apply database resources (pvc → deployment → service)
☐ Database pod is Running (kubectl get pods)
☐ Apply migration job (kubectl apply -f Jobs/migrate-job.yaml)
☐ Wait for migration job to complete
☐ Apply seed job (kubectl apply -f Jobs/seed-job.yaml)
☐ Wait for seed job to complete
☐ Apply backend resources (deployment → service)
☐ Backend pod is Running and logs show "listening on port 5000"
☐ Apply frontend resources (deployment → service)
☐ Frontend pod is Running
☐ Port-forward and test endpoints
```

## Scaling & Production Readiness

### Horizontal Scaling
Edit deployment `spec.replicas`:
```yaml
# backend-deployment.yaml
spec:
  replicas: 3  # Scale to 3 replicas
```

### Liveness & Readiness Probes (Add for production)
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Resource Limits (Add for production)
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Ingress (Alternative to LoadBalancer)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shopsphere-ingress
  namespace: shopsphere
spec:
  rules:
  - host: shopsphere.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-svc
            port:
              number: 5000
```

## Troubleshooting

### Job stuck in Pending
```bash
kubectl describe job backend-migrate -n shopsphere
# Check: events section for wait-for-db timeout
```

### Migration logs
```bash
# Real-time logs
kubectl logs -n shopsphere -f job/backend-migrate

# Completed job logs (pod auto-deleted, check events)
kubectl describe job backend-migrate -n shopsphere
```

### Backend can't connect to DB
```bash
# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n shopsphere -- nslookup mysql-svc

# Verify secret is mounted
kubectl exec -it -n shopsphere deploy/backend -- env | grep DB_
```

### Frontend can't reach backend
```bash
# Check ConfigMap has correct backend URL
kubectl get configmap backends.yaml -n shopsphere -o yaml

# Port-forward backend and test locally
kubectl port-forward -n shopsphere svc/backend-svc 5000:5000 &
curl http://localhost:5000/api/products  # or your endpoint
```

## Maintenance

### Update image versions
```bash
kubectl set image deployment/backend backend=princewillopah/shopshere-node-backend:1.3 -n shopsphere
```

### Restart deployments
```bash
kubectl rollout restart deployment/backend -n shopsphere
```

### View rollout history
```bash
kubectl rollout history deployment/backend -n shopsphere
kubectl rollout undo deployment/backend -n shopsphere  # Rollback to previous
```

### Delete everything
```bash
kubectl delete namespace shopsphere
# This deletes all resources in the namespace (Deployments, Services, PVCs, Secrets, ConfigMaps, Jobs)
```

## Comparison: v1 vs v2

| Feature | v1 (Basics) | v2 (Production Ready) |
|---|---|---|
| **Manifest Organization** | Flat (all in Kubernetes/) | Organized (database/, backend/, Jobs/, etc.) |
| **DB Initialization** | Embedded in backend deployment | Explicit K8s Jobs |
| **Secrets** | Single file (mixed) | Organized by concern (backend.yaml, aws-s3.yaml) |
| **ConfigMaps** | Single file (mixed) | Organized by service (backends.yaml, frontend.yaml) |
| **Job Pattern** | N/A | migrate-job + seed-job |
| **Scalability** | Basic | Production-ready |
| **Auto-cleanup** | N/A | Jobs auto-delete after 5 min |
| **Idempotency** | Lower (embedded logic) | Higher (K8s Jobs pattern) |

## Related Files

- [Docker-version/README.md](../Docker-version/README.md) — Docker Compose setup
- [Kubernetes-1-basics/README.md](../Kubernetes-1-basics/README.md) — Initial K8s conversion
- [backend/README.md](backend/README.md) — Express app documentation
- [frontend/README.md](frontend/README.md) — React app documentation

## References

- [K8s Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [ConfigMaps vs Secrets](https://kubernetes.io/docs/concepts/configuration/overview/)
- [PersistentVolumeClaims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
