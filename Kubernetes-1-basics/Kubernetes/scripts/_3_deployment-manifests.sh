#!/bin/bash
cd "/home/ubuntu/Shopsphere-NodeJS/Kubernetes-1-basics/Kubernetes" || exit 1

kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmaps.yaml
kubectl apply -f mysql-pvc.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f mysql-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml


echo "Waiting 30 seconds for services to initialize..."
for i in {30..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""


# 5. Wait for everything
kubectl get pods -n shopsphere
# Should show db, backend, frontend Running

echo "Waiting 10 seconds for services to initialize..."
for i in {10..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""

echo "Seeding database..."
kubectl exec -it deployment/backend -n shopsphere -- npm run seed

echo "  ✅ Deployment completed successfully. You can access the frontend at http://localhost:3000 and the backend at http://localhost:5000"


pkill -f "kubectl port-forward"
kubectl port-forward service/backend -n shopsphere 5000:5000 --address 0.0.0.0 > /dev/null 2>&1 &
kubectl port-forward service/frontend -n shopsphere 3000:80 --address 0.0.0.0 > /dev/null 2>&1 &

# 6. Check logs if needed
# kubectl logs -f deployment/backend -n shopsphere
# kubectl logs -f deployment/db -n shopsphere