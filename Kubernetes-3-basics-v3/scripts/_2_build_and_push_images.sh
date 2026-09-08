#!/bin/bash
set -e

echo "☸️  Building and pushing images to Kubernetes"
echo ""

REGISTRY="princewillopah" 
APP_NAME="shopsphere-node"
image_tag="1.2" # This will be automatically managed by script _1

# Dynamically target the project root folder (sibling directories backend & frontend)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "$DOCKER_TOKEN1" | docker login -u "$DOCKER_USERNAME1" --password-stdin

echo ""
echo " ================================================================= "
echo "📦 Building and pushing images to $REGISTRY..."
echo " ================================================================= "

docker build -t $REGISTRY/$APP_NAME-backend:$image_tag "$PROJECT_ROOT/backend"
docker push $REGISTRY/$APP_NAME-backend:$image_tag

docker build -t $REGISTRY/$APP_NAME-frontend:$image_tag "$PROJECT_ROOT/frontend"
docker push $REGISTRY/$APP_NAME-frontend:$image_tag

echo ""
echo " ================================================================= "
echo "📦 Next is calling the script to deploy the manifests to Kubernetes"
echo " ================================================================= "

./_3_deployment-manifests.sh
