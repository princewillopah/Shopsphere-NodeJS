#!/bin/bash
set -e

if [ $# -ne 1 ]; then
  echo "Usage: ./_0_scripts_runner.sh <version>"
  echo "Example: ./_0_scripts_runner.sh 1.3"
  exit 1
fi

./_1_update-image-tags.sh "$1"

echo "Waiting 5 seconds for stability..."
for i in {5..1}; do
    printf "\r  ⏳ %02d seconds remaining..." $i
    sleep 1
done
echo ""
echo ""

./_2_build_and_push_images.sh


