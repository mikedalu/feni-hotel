#!/bin/bash

# Feni Hotel - Deployment Script
# This script is triggered by the webhook listener when a new release is pushed to GitHub Container Registry.

set -e

echo "Starting deployment at $(date)"

# Go to the root of the project
cd "$(dirname "$0")/.."

# Pull the latest images defined in the prod compose file
echo "Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Recreate and restart the containers in detached mode
echo "Restarting containers..."
docker compose -f docker-compose.prod.yml up -d

# Clean up dangling images to save space
echo "Pruning old Docker images..."
docker image prune -f

echo "Deployment completed successfully at $(date)"
