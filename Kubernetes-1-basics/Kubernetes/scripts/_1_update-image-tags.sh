#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/home/ubuntu/Shopsphere-NodeJS/Kubernetes-1-basics/Kubernetes"
# BASE_DIR="/home/princewillopah/DevOps/_Single-App-Directory/⭐Shopsphere-NodeJS/Kubernetes-1-basics/Kubernetes"

if [ $# -ne 1 ]; then
  echo "Usage: ./update-image-tags.sh <new-version>"
  echo "Example: ./update-image-tags.sh 1.0.6"
  exit 1
fi

NEW_TAG="$1"

echo "Updating all image tags to: $NEW_TAG"
echo ""

find "$BASE_DIR" -name "backend-deployment.yaml" | while read -r file; do
    echo "Processing $file"
    sed -i -E "s|(image:\s*princewillopah/shopshere-node-backend:).*|\1${NEW_TAG}|g" "$file"
done

find "$BASE_DIR" -name "frontend-deployment.yaml" | while read -r file; do
    echo "Processing $file"
    sed -i -E "s|(image:\s*princewillopah/shopshere-node-frontend:).*|\1${NEW_TAG}|g" "$file"
done


find "$BASE_DIR" -name "_2_build_and_push_images.sh" | while read -r file; do
    echo "Processing $file"
    sed -i -E 's|(image_tag=")[^"]*("\s*$)|\1'"$NEW_TAG"'\2|g' "$file"
done

echo ""
echo "All image tags updated successfully."