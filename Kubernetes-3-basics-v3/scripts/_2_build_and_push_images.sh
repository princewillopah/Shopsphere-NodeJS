#!/bin/bash
set -e

echo "☸️  Building and pushing images to Kubernetes"
echo ""

REGISTRY="princewillopah"
IMAGE_TAG="${1:-latest}"
BACKEND_IMAGE="$REGISTRY/shopsphere-node-backend:$IMAGE_TAG"
FRONTEND_IMAGE="$REGISTRY/shopsphere-nodejs-ui:$IMAGE_TAG"

# The Kubernetes manifests live in this directory, but the application source
# used to build the images lives in the sibling Application directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$REPO_ROOT/Application"

echo "$DOCKER_TOKEN1" | docker login -u "$DOCKER_USERNAME1" --password-stdin

echo ""
echo " ================================================================= "
echo "📦 Building and pushing images to $REGISTRY..."
echo " ================================================================= "

docker build -t "$BACKEND_IMAGE" "$PROJECT_ROOT/backend"
docker push "$BACKEND_IMAGE"

docker build -t "$FRONTEND_IMAGE" "$PROJECT_ROOT/frontend"
docker push "$FRONTEND_IMAGE"

echo ""
echo " ================================================================= "
echo "📦 Next is calling the script to deploy the manifests to Kubernetes"
echo " ================================================================= "

./_3_deployment-manifests.sh
