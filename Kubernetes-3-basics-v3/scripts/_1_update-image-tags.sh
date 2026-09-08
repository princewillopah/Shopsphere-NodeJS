#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")/Kubernetes"

if [ $# -ne 1 ]; then
  echo "Usage: ./update-image-tags.sh <new-version>"
  echo "Example: ./update-image-tags.sh 1.0.6"
  exit 1
fi

echo "Targeting Manifests Directory: $BASE_DIR"
NEW_TAG="$1"

echo "Updating all image tags to: $NEW_TAG"
echo ""

find "$BASE_DIR" -name "migrate-job.yaml" | while read -r file; do
    echo "Processing $file"
    sed -i -E "s|(image:\s*princewillopah/shopsphere-node-backend:).*|\1${NEW_TAG}|g" "$file"
done

find "$BASE_DIR" -name "seed-job.yaml" | while read -r file; do
    echo "Processing $file"
    sed -i -E "s|(image:\s*princewillopah/shopsphere-node-backend:).*|\1${NEW_TAG}|g" "$file"
done

find "$BASE_DIR" -name "deployment.yaml" | while read -r file; do
    echo "Processing $file"
    sed -i -E "s|(image:\s*princewillopah/shopsphere-node-backend:).*|\1${NEW_TAG}|g" "$file"
    sed -i -E "s|(image:\s*princewillopah/shopsphere-node-frontend:).*|\1${NEW_TAG}|g" "$file"
done

# Search for the script file inside the current scripts directory
find "$SCRIPT_DIR" -name "_2_build_and_push_images.sh" | while read -r file; do
    echo "Processing $file"
    # This matches the tag and allows trailing comments/spaces on the same line
    sed -i -E 's|(image_tag=")[^"]*(".*)|\1'"$NEW_TAG"'\2|g' "$file"
done


echo ""
echo "All image tags updated successfully."
