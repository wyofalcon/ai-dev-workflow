#!/bin/bash

# CVstomize Backend API - Cloud Run Deployment Script
# This script builds and deploys the backend API to Google Cloud Run

set -e  # Exit on error

echo "🚀 Starting CVstomize Backend API Deployment to Cloud Run"
echo "=========================================================="

# Configuration
PROJECT_ID="cvstomize"
REGION="us-central1"
SERVICE_NAME="cvstomize-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
echo "✅ Checking authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
    echo "❌ Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
}

# Set project
echo "✅ Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Build container image
echo ""
echo "📦 Building container image..."
echo "This may take 2-3 minutes..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo ""
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=3001,GCP_PROJECT_ID=${PROJECT_ID},LOG_LEVEL=info \
  --add-cloudsql-instances ${PROJECT_ID}:${REGION}:cvstomize-db \
  --set-secrets DATABASE_URL=cvstomize-db-connection-string:latest

# Get the service URL
echo ""
echo "✅ Deployment complete!"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 Backend API deployed successfully!"
echo "=========================================================="
echo ""
echo "Service URL: ${SERVICE_URL}"
echo "Health Check: ${SERVICE_URL}/health"
echo ""
echo "Test the API:"
echo "  curl ${SERVICE_URL}/health"
echo ""
echo "Next steps:"
echo "  1. Test health endpoint"
echo "  2. Update frontend .env with: REACT_APP_API_URL=${SERVICE_URL}/api"
echo "  3. Test authentication flow"
echo ""
