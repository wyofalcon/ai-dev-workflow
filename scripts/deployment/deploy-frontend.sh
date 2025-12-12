#!/bin/bash
#
# CVstomize Frontend Deployment Script
#
# IMPORTANT: Always deploy with REACT_APP_API_URL build env var to avoid
# localhost fallback that triggers browser local network permission prompt.
#
# Usage:
#   ./deploy-frontend.sh
#

set -e  # Exit on error

PROJECT_ID="cvstomize"
SERVICE_NAME="cvstomize-frontend"
REGION="us-central1"
API_URL="https://cvstomize-api-351889420459.us-central1.run.app"

echo "🚀 Deploying CVstomize Frontend to Cloud Run..."
echo ""
echo "Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  API URL: $API_URL"
echo ""

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-build-env-vars REACT_APP_API_URL="$API_URL" \
  --project="$PROJECT_ID" \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: https://cvstomize-frontend-351889420459.us-central1.run.app"
