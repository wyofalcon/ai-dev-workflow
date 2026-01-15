#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Staging Deployment..."

# Configuration
PROJECT_ID="cvstomize-staging" # Replace with actual staging project ID if different
REGION="us-central1"
API_SERVICE_NAME="cvstomize-api-staging"
CLIENT_SERVICE_NAME="cvstomize-client-staging"

# Ensure we are authenticated
echo "Checking gcloud authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# 1. Deploy API (Backend)
echo "📦 Building and Deploying API to Staging..."
cd api
gcloud builds submit --tag gcr.io/$PROJECT_ID/$API_SERVICE_NAME .

gcloud run deploy $API_SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$API_SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=staging \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,FIREBASE_SERVICE_ACCOUNT=FIREBASE_SERVICE_ACCOUNT:latest

cd ..

# 2. Deploy Client (Frontend)
echo "📦 Building and Deploying Client to Staging..."
# Note: Ensure REACT_APP_API_URL points to the staging API URL
STAGING_API_URL=$(gcloud run services describe $API_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "Staging API URL detected: $STAGING_API_URL"

gcloud builds submit --tag gcr.io/$PROJECT_ID/$CLIENT_SERVICE_NAME \
  --substitutions=_REACT_APP_API_URL=$STAGING_API_URL .

gcloud run deploy $CLIENT_SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$CLIENT_SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated

echo "✅ Staging Deployment Complete!"
echo "API: $STAGING_API_URL"
echo "Client: $(gcloud run services describe $CLIENT_SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')"
