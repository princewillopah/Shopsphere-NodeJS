#!/bin/bash
set -e

./_1_update-image-tags.sh "$1"

echo "Waiting 10 seconds for services to initialize..."
for i in {10..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""

./_2_build_and_push_images.sh

# echo "Waiting 10 seconds for services to initialize..."
# for i in {10..1}; do
#     printf "\r  ⏳ %02d seconds remaining..." $i
#     sleep 1
# done
# echo ""

# ./_3_deployment-manifests.sh



