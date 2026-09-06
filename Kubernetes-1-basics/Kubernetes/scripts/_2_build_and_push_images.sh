#!/bin/bash
set -e

echo "☸️  Building and pushing images to Kubernetes"
echo ""

REGISTRY="princewillopah" # Change this to your DockerHub username or registry URL if using a different registry
APP_NAME="shopshere-node"
image_tag="1.3"

rootDir="/home/ubuntu/Shopsphere-NodeJS/Kubernetes-1-basics"

# Login to DockerHub
echo "$DOCKER_TOKEN1" | docker login -u "$DOCKER_USERNAME1" --password-stdin

echo ""
echo " ================================================================= "
echo "📦 Building and pushing images to $REGISTRY..."
echo " ================================================================= "

  docker build -t $REGISTRY/$APP_NAME-backend:$image_tag $rootDir/backend
  docker push $REGISTRY/$APP_NAME-backend:$image_tag

  docker build -t $REGISTRY/$APP_NAME-frontend:$image_tag $rootDir/frontend
  docker push $REGISTRY/$APP_NAME-frontend:$image_tag



echo ""
echo " ================================================================= "
echo "📦 Next is caling the script to deploayy the manifests to Kubernetes"
echo " ================================================================= "

./_3_deployment-manifests.sh

# services="task-service user-service notification-service analytics-service api-gateway frontend"
# for service in $services; do
# # Set build context for frontend
#   dir="./Apps/services/$service"
#   if [ "$service" == "frontend" ]; then
#     dir="./Apps/frontend"
#   fi


#   echo "Building $service..."
#   docker build -t $REGISTRY/$APP_NAME-$service:$image_tag $dir
#   docker push $REGISTRY/$APP_NAME-$service:$image_tag
#   echo ""
# done


# echo "✅ Services are completely built and pushed to DockerHub"
# echo ""
# echo "Copy the following to kubernetes yaml files"
# echo "------------------------------------------------------------------"
# for service in $services; do
#   echo "$REGISTRY/$APP_NAME-$service:$image_tag"
# done