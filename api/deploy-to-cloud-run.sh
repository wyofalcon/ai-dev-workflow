#!/bin/bash
set -e

echo "🚀 CVstomize Backend Deployment to GCP Cloud Run"
echo "================================================"

# Configuration
PROJECT_ID="cvstomize-test"
REGION="us-central1"
SERVICE_NAME="cvstomize-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Set project
echo "📋 Setting GCP project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Build the Docker image using Cloud Build
echo "🔨 Building Docker image with Cloud Build..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info,ENABLE_CLOUD_STORAGE=true,GCS_RESUMES_BUCKET=cvstomize-resumes-prod,GCP_PROJECT_ID=${PROJECT_ID}" \
  --set-cloudsql-instances "${PROJECT_ID}:${REGION}:cvstomize-db" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 60 \
  --max-instances 10 \
  --min-instances 0

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "📍 Service URL: ${SERVICE_URL}"
echo ""
echo "🔍 Next steps:"
echo "  1. Run migrations: npm run migrate:prod"
echo "  2. Test health: curl ${SERVICE_URL}/health"
echo "  3. View logs: gcloud run logs read ${SERVICE_NAME} --region ${REGION} --limit 50"
echo ""
