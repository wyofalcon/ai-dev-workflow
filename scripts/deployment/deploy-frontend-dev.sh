#!/bin/bash
# Deploy Cvstomize Frontend to DEV environment

set -e

PROJECT_ID="cvstomize"
SERVICE_NAME="cvstomize-frontend-dev"
API_SERVICE_NAME="cvstomize-api-dev"
REGION="us-central1"

echo "🚀 Deploying Frontend to DEV environment"
echo "=================================================="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "API Target: $API_SERVICE_NAME"
echo "=================================================="

# Check directory
if [ ! -f "package.json" ] || [ ! -f "docker/Dockerfile.frontend" ]; then
    echo "⚠️  Error: Please run this script from the root directory (where package.json is)."
    exit 1
fi

# Get API URL
echo "🔍 Fetching Dev API URL..."
API_URL=$(gcloud run services describe $API_SERVICE_NAME --project=$PROJECT_ID --region=$REGION --format 'value(status.url)' 2>/dev/null || true)

if [ -z "$API_URL" ]; then
    echo "❌ Error: Could not find service '$API_SERVICE_NAME'. Please deploy the Dev API first."
    exit 1
fi
echo "✅ Found API URL: $API_URL"

# Confirm
read -p "Deploy Frontend to DEV pointing to $API_URL? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# Build Image
echo "🔨 Building Docker image..."
gcloud builds submit --config ci/cloudbuild.frontend-dev.yaml --substitutions=_API_URL=$API_URL .

# Deploy to Cloud Run
echo "📦 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s

# Get URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --project=$PROJECT_ID --region=$REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌎 Dev Frontend URL: $SERVICE_URL"
