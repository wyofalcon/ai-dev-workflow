#!/bin/bash
# Deploy BOTH Backend and Frontend to DEV environment

set -e

echo "🚀 Deploying FULL STACK to DEV environment"
echo "=================================================="

# Deploy API
echo "👉 Step 1: Deploying API..."
if [ -d "api" ]; then
    cd api
    ../scripts/deployment/deploy-api-dev.sh
    cd ..
else
    echo "❌ Error: 'api' directory not found."
    exit 1
fi

# Deploy Frontend
echo ""
echo "👉 Step 2: Deploying Frontend..."
./scripts/deployment/deploy-frontend-dev.sh

echo ""
echo "✅ Full Stack Dev Deployment Complete!"
