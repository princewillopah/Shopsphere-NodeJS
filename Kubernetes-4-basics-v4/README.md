# ShopSphere — Kubernetes (Basics v3 - Production Ready)

**Status: implemented.** Kubernetes deployment with organized manifests, explicit initialization Jobs, encrypted Sealed Secrets, network isolation, and pod/container security controls.

This version improves upon earlier versions by introducing **organized manifest directories**, **K8s Jobs for database initialization**, **Sealed Secrets for sensitive values**, **NetworkPolicies**, and **hardened pod/container security contexts**.

```
Kubernetes-3-basics-v3/
├── Kubernetes/
│   ├── namespace.yaml                   # shopsphere namespace
│   ├── configmaps/                      # ConfigMaps by concern
│   │   ├── backend.yaml                 # Backend app config
│   │   └── frontend.yaml                # Frontend app config
│   ├── secrets/                         # Encrypted secrets by concern
│   │   ├── backend-sealed-secret.yaml   # DB, JWT, and seed secrets
│   │   └── aws-s3-sealed-secret.yaml    # AWS S3 credentials
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
│   ├── network-policy/                  # Pod-to-pod traffic restrictions
│   │   ├── backend-allow-frontend.yaml
│   │   └── db-allow-only-backend.yaml
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

### 3. **Encrypted Secret Organization**
Earlier versions: plaintext Kubernetes Secret manifests with all credentials mixed together.

v3: Organized and encrypted by concern:
- **backend-sealed-secret.yaml**: database credentials, JWT secret, and seed password
- **aws-s3-sealed-secret.yaml**: AWS access key and secret key for the S3 bucket

**Why**: SealedSecret manifests can be committed safely because their values are encrypted for the cluster's Sealed Secrets controller. The controller decrypts them into ordinary Kubernetes Secrets at deploy time.

### 4. **Better ConfigMap Organization**
v1: Single `configmaps.yaml` for everything

v2: Organized by service:
- **backend.yaml**: Backend-specific config (DB host, S3 region, storage settings)
- **frontend.yaml**: Frontend-specific config (API base URL, analytics, feature flags)

**Why**: Clearer dependencies; easier to scale frontend config independently.

## Architecture (v3)

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
│  frontend             backend               db                      │
│                                                                      │
│  ConfigMaps:                                                        │
│    ├── backend.yaml                                                 │
│    └── frontend.yaml                                                │
│  SealedSecrets:                                                     │
│    ├── backend-sealed-secret.yaml                                   │
│    └── aws-s3-sealed-secret.yaml                                    │
│  NetworkPolicies:                                                   │
│    ├── frontend → backend                                           │
│    └── backend → database                                           │
│  Storage:                                                           │
│    └── mysql-pvc (10Gi)                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Kubernetes cluster** (minikube, kind, or cloud: EKS/AKS/GKE)
- **kubectl** configured and pointing to your cluster
- **Sealed Secrets controller** installed in the cluster
- **Docker images** pushed to a registry
  - `princewillopah/shopsphere-node-backend:latest`
  - `princewillopah/shopsphere-nodejs-ui:latest`

## Deploy

### Quick Start (One Command)
```bash
# Apply all manifests in order (directory walk respects alphabetical order)
kubectl apply -R -f Kubernetes/
```

**Note**: This works because Kubernetes applies resources in dependency order (namespace first, Jobs after database, etc.). However, for more control, follow the manual steps below.

### Manual Deployment (Recommended for first time)

#### Step 1: Install Sealed Secrets and create the namespace
```bash
# Install once per cluster if the controller is not already installed.
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system

kubectl apply -f Kubernetes/namespace.yaml
kubectl apply -f Kubernetes/secrets/backend-sealed-secret.yaml
kubectl apply -f Kubernetes/secrets/aws-s3-sealed-secret.yaml
```

The Sealed Secrets controller decrypts these resources into `shopsphere-secrets` and `shopsphere-s3-secrets`. Do not replace `encryptedData` with plaintext credentials. To rotate a value, create a new temporary Secret locally, seal it with the cluster certificate, and apply only the generated SealedSecret:

```bash
kubectl create secret generic shopsphere-s3-secrets \
  --from-literal=AWS_ACCESS_KEY_ID='new-access-key' \
  --from-literal=AWS_SECRET_ACCESS_KEY='new-secret-key' \
  -n shopsphere --dry-run=client -o yaml |
  kubeseal --format yaml > Kubernetes/secrets/aws-s3-sealed-secret.yaml
```

Verify that the controller created the underlying Secrets without printing their values:

```bash
kubectl get sealedsecret -n shopsphere
kubectl get secret shopsphere-secrets shopsphere-s3-secrets -n shopsphere
```

#### Step 2: Create ConfigMaps
```bash
kubectl apply -f Kubernetes/configmaps/backend.yaml
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
kubectl port-forward -n shopsphere svc/backend 5000:5000 &
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
kubectl port-forward -n shopsphere svc/frontend 3000:80 &

# Backend API (http://localhost:5000)
kubectl port-forward -n shopsphere svc/backend 5000:5000 &
```

### LoadBalancer (cloud clusters)
```bash
# Edit frontend service to LoadBalancer type
kubectl patch svc frontend -n shopsphere -p '{"spec":{"type":"LoadBalancer"}}'

# Get external IP
kubectl get svc -n shopsphere frontend
# EXTERNAL-IP will appear (cloud) or stay <pending> (minikube)
```

### NodePort (bare-metal Kubernetes)
```bash
kubectl patch svc frontend -n shopsphere -p '{"spec":{"type":"NodePort"}}'
kubectl get svc -n shopsphere frontend
# Access via <NODE-IP>:<NODE-PORT>
```

## Manifest Files Overview

### Secrets (`secrets/`)

| File | Purpose | Contains |
|---|---|---|
| `backend-sealed-secret.yaml` | Encrypted backend credentials | Database credentials, `JWT_SECRET`, seed password |
| `aws-s3-sealed-secret.yaml` | Encrypted AWS credentials | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |

The encrypted files are safe to store in Git, but access keys must still be rotated and scoped to the required S3 bucket and `products/*` prefix.

### ConfigMaps (`configmaps/`)

| File | Purpose | Contains |
|---|---|---|
| `backend.yaml` | Backend app config | `DB_HOST`, `DB_PORT`, `AWS_REGION`, `S3_BUCKET`, `STORAGE_PROVIDER` |
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

### Network Policies (`network-policy/`)

| File | Purpose |
|---|---|
| `backend-allow-frontend.yaml` | Allows TCP/5000 to backend pods from frontend pods and the ingress namespace |
| `db-allow-only-backend.yaml` | Allows TCP/3306 to database pods only from backend pods |

These policies restrict ingress between application tiers. They require a network plugin that enforces NetworkPolicy rules. Services and port-forwards can still expose an application externally while pod-to-pod access remains limited.

### Pod and Container Security

The backend, frontend, and initialization Jobs use security contexts:

- Run as non-root users with explicit UID/GID values.
- Use the `RuntimeDefault` seccomp profile where configured.
- Disable privilege escalation.
- Drop all Linux capabilities.
- Use a read-only root filesystem for application containers.
- Mount only the writable `/tmp` `emptyDir` volume needed by the application.
- Set CPU and memory requests/limits and health probes.

The MySQL image uses its required non-root UID in the migration Job init container. These controls reduce the impact of a compromised process; they do not replace image scanning, IAM least privilege, or NetworkPolicy enforcement.

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
        image: princewillopah/shopsphere-node-backend:latest
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

### 3. SealedSecret vs ConfigMap Split
- **ConfigMaps**: Non-sensitive data such as service names, ports, feature flags, and API paths.
- **SealedSecrets**: Encrypted sensitive data such as passwords, JWT secrets, and AWS credentials.
- **Generated Secrets**: The Sealed Secrets controller creates `shopsphere-secrets` and `shopsphere-s3-secrets` from the encrypted manifests.

**Why**: Sensitive values are not committed as plaintext, while workloads still receive normal Kubernetes Secrets through `envFrom` and `secretKeyRef`.

### 4. NetworkPolicy Isolation
The v3 policies implement a three-tier traffic boundary:

```text
Frontend pods ──TCP/5000──> Backend pods ──TCP/3306──> Database pods
```

- `backend-allow-frontend.yaml` permits backend ingress from frontend pods and the ingress namespace.
- `db-allow-only-backend.yaml` permits database ingress only from backend pods.
- The cluster CNI must enforce NetworkPolicy objects; otherwise these manifests have no traffic-blocking effect.

Apply them after the application resources:

```bash
kubectl apply -f Kubernetes/network-policy/backend-allow-frontend.yaml
kubectl apply -f Kubernetes/network-policy/db-allow-only-backend.yaml
```

### 5. Pod and Container Security
Backend and Job pods run as non-root users with a `RuntimeDefault` seccomp profile where configured. Application containers also disable privilege escalation, drop all Linux capabilities, and use read-only root filesystems with an explicit writable `/tmp` volume. The frontend applies the same container restrictions and runs as UID/GID 101 for the unprivileged Nginx image.

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
☐ Sealed Secrets contain current encrypted values (JWT, DB creds, S3 keys)
☐ Sealed Secrets controller is installed and healthy
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
☐ NetworkPolicies applied and enforced by the cluster CNI
☐ Pods run as non-root with restricted container security contexts
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
            name: frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
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
# Check ConfigMap has the expected backend configuration
kubectl get configmap shopsphere-config -n shopsphere -o yaml

# Port-forward backend and test locally
kubectl port-forward -n shopsphere svc/backend 5000:5000 &
curl http://localhost:5000/api/products  # or your endpoint
```

## Maintenance

### Update image versions
```bash
kubectl set image deployment/backend backend=princewillopah/shopsphere-node-backend:latest -n shopsphere
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

## Comparison: v1 vs v3

| Feature | v1 (Basics) | v3 (Production Ready) |
|---|---|---|
| **Manifest Organization** | Flat (all in Kubernetes/) | Organized (database/, backend/, Jobs/, etc.) |
| **DB Initialization** | Embedded in backend deployment | Explicit K8s Jobs |
| **Secrets** | Plaintext/mixed | Encrypted SealedSecrets by concern (backend + AWS S3) |
| **ConfigMaps** | Single file (mixed) | Backend and frontend configuration separated |
| **Network isolation** | Not defined | Frontend → backend → database NetworkPolicies |
| **Pod/container security** | Default | Non-root, seccomp, dropped capabilities, read-only root filesystem |
| **Job Pattern** | N/A | migrate-job + seed-job |
| **Scalability** | Basic | Production-ready |
| **Auto-cleanup** | N/A | Jobs auto-delete after 5 min |
| **Idempotency** | Lower (embedded logic) | Higher (K8s Jobs pattern) |

## Related Files

- [Docker-version/README.md](../Docker-version/README.md) — Docker Compose setup
- [Kubernetes-1-basics/README.md](../Kubernetes-1-basics/README.md) — Initial K8s conversion

## References

- [K8s Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [ConfigMaps vs Secrets](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Pod Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
- [PersistentVolumeClaims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
