#!/bin/bash
set -e

NAMESPACE="shopsphere"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFESTS_DIR="$(dirname "$SCRIPT_DIR")/Kubernetes"

cd "$MANIFESTS_DIR" || exit 1


# 1. Scale down deployments first to safely detach volumes
kubectl scale deployment/db -n ${NAMESPACE} --replicas=0 || true
kubectl scale deployment/backend -n ${NAMESPACE} --replicas=0 || true
kubectl scale deployment/frontend -n ${NAMESPACE} --replicas=0 || true

# 2. Wait a few seconds for the pods to terminate naturally and release the PVC
echo "⏳ Waiting for old pods to terminate and release volumes..."
kubectl wait --for=delete pod -l app=db -n ${NAMESPACE} --timeout=30s || true


# 3. Clean up the rest of the resources
kubectl delete job --all -n ${NAMESPACE} || true
kubectl delete pvc mysql-pvc -n ${NAMESPACE} || true

# 4. Create configs and secrets
kubectl apply -f secrets/backend.yaml
kubectl apply -f secrets/aws-s3.yaml

kubectl apply -f configmaps/backend.yaml
kubectl apply -f configmaps/frontend.yaml

# 5. DB must be running
kubectl apply -f database/pvc.yaml
kubectl apply -f database/deployment.yaml
kubectl apply -f database/service.yaml
kubectl wait --for=condition=ready pod -l app=db -n ${NAMESPACE:-shopsphere}    --timeout=120s

# 6. Run MIGRATION job
kubectl apply -f jobs/migrate-job.yaml
kubectl wait --for=condition=complete job/backend-migrate -n ${NAMESPACE:-shopsphere}   --timeout=120s
kubectl logs job/backend-migrate -n ${NAMESPACE:-shopsphere}   

# 7. Now deploy backend
kubectl apply -f backend/deployment.yaml
kubectl apply -f backend/service.yaml
kubectl wait --for=condition=available deployment/backend -n ${NAMESPACE:-shopsphere}   --timeout=120s


# 8. Apply the Horizontal Pod Autoscaler and Pod Disruption Budget for the backend
kubectl apply -f autoscaling/hpa.yaml
kubectl apply -f autoscaling/pdb.yaml


# 9. Run SEED job
kubectl apply -f jobs/seed-job.yaml
kubectl wait --for=condition=complete job/backend-seed -n ${NAMESPACE:-shopsphere}  --timeout=120s
kubectl logs job/backend-seed -n ${NAMESPACE:-shopsphere} 


# 10. Deploy frontend
kubectl apply -f frontend/deployment.yaml
kubectl apply -f frontend/service.yaml


# 11. Wait for everything
echo "Waiting 30 seconds for services to initialize..."
for i in {30..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""


# 12. Check the status of the pods
kubectl get pods -n shopsphere
# Should show db, backend, frontend Running

# 13. Wait for everything
echo "Waiting 10 seconds for services to initialize..."
for i in {10..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""

# =================================================================
# 14. Port forward the services with auto-reconnect loops
# =================================================================
echo "🔌 Setting up persistent port-forwards..."

# Create a hidden log folder for debugging if things break
mkdir -p .port_forward_logs

# Kill ONLY the port-forwards matching your specific services, keeping other kubectl tasks safe
pkill -f "port-forward service/backend" || true
pkill -f "port-forward service/frontend" || true

# Auto-reconnecting loop for Backend (5000:5000)
(
    while true; do
        echo "[$(date)] Starting Backend Port-Forward..." >> .port_forward_logs/backend.log
        kubectl port-forward service/backend -n ${NAMESPACE} 5000:5000 --address 0.0.0.0 >> .port_forward_logs/backend.log 2>&1
        echo "[$(date)] Backend Port-Forward crashed. Reconnecting in 2 seconds..." >> .port_forward_logs/backend.log
        sleep 2
    done
) &

# Auto-reconnecting loop for Frontend (3000:80)
(
    while true; do
        echo "[$(date)] Starting Frontend Port-Forward..." >> .port_forward_logs/frontend.log
        kubectl port-forward service/frontend -n ${NAMESPACE} 3000:80 --address 0.0.0.0 >> .port_forward_logs/frontend.log 2>&1
        echo "[$(date)] Frontend Port-Forward crashed. Reconnecting in 2 seconds..." >> .port_forward_logs/frontend.log
        sleep 2
    done
) &

# Give the background loops a moment to establish their first connection
sleep 2

# 15. Deployment completed successfully
echo "  ✅ Deployment completed successfully. You can access the frontend at http://localhost:3000 and the backend at http://localhost:5000"


# 166. Check logs if needed
# kubectl logs -f deployment/backend -n shopsphere
# kubectl logs -f deployment/db -n shopsphere



