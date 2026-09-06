#!/bin/bash
set -e

NAMESPACE="shopsphere"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFESTS_DIR="$(dirname "$SCRIPT_DIR")/Kubernetes"

cd "$MANIFESTS_DIR" || exit 1

# 0. Clean old broken backend

kubectl delete job --all -n ${NAMESPACE:-shopsphere} || true
kubectl delete job backend-migrate backend-seed -n ${NAMESPACE:-shopsphere} || true
kubectl delete pvc mysql-pvc -n ${NAMESPACE:-shopsphere} || true
kubectl delete pod -l app=db -n ${NAMESPACE:-shopsphere} --force --grace-period=0 || true



kubectl apply -f secrets/backend.yaml
kubectl apply -f secrets/aws-s3.yaml

kubectl apply -f configmaps/backend.yaml
kubectl apply -f configmaps/frontend.yaml

# 1. DB must be running
kubectl apply -f database/pvc.yaml
kubectl apply -f database/deployment.yaml
kubectl apply -f database/service.yaml
kubectl wait --for=condition=ready pod -l app=db -n ${NAMESPACE:-shopsphere}    --timeout=120s

# 2. Run MIGRATION job
kubectl apply -f jobs/migrate-job.yaml
kubectl wait --for=condition=complete job/backend-migrate -n ${NAMESPACE:-shopsphere}   --timeout=120s
kubectl logs job/backend-migrate -n ${NAMESPACE:-shopsphere}   

# 3. Now deploy backend
kubectl apply -f backend/deployment.yaml
kubectl apply -f backend/service.yaml
kubectl wait --for=condition=available deployment/backend -n ${NAMESPACE:-shopsphere}   --timeout=120s


# 4. Apply the Horizontal Pod Autoscaler and Pod Disruption Budget for the backend
kubectl apply -f hpa.yaml
kubectl apply -f pdb.yaml


# 5. Run SEED job
kubectl apply -f jobs/seed-job.yaml
kubectl wait --for=condition=complete job/backend-seed -n ${NAMESPACE:-shopsphere}  --timeout=120s
kubectl logs job/backend-seed -n ${NAMESPACE:-shopsphere} 


# 6. Deploy frontend
kubectl apply -f frontend/deployment.yaml
kubectl apply -f frontend/service.yaml


# 7. Wait for everything
echo "Waiting 30 seconds for services to initialize..."
for i in {30..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""


# 8. Check the status of the pods
kubectl get pods -n shopsphere
# Should show db, backend, frontend Running

# 9. Wait for everything
echo "Waiting 10 seconds for services to initialize..."
for i in {10..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""

# 10. Port forward the backend and frontend services to localhost
pkill -f "kubectl port-forward"
kubectl port-forward service/backend -n shopsphere 5000:5000 --address 0.0.0.0 > /dev/null 2>&1 &
kubectl port-forward service/frontend -n shopsphere 3000:80 --address 0.0.0.0 > /dev/null 2>&1 &

# 11. Deployment completed successfully
echo "  ✅ Deployment completed successfully. You can access the frontend at http://localhost:3000 and the backend at http://localhost:5000"


# 12. Check logs if needed
# kubectl logs -f deployment/backend -n shopsphere
# kubectl logs -f deployment/db -n shopsphere



