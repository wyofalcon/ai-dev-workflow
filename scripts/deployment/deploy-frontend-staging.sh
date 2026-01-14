#!/bin/bash
#
# CVstomize Frontend Deployment Script - STAGING ENVIRONMENT
#
# Deploys frontend to cvstomize-staging project with staging API URL
#
# Usage:
#   ./deploy-frontend-staging.sh
#

set -e  # Exit on error

PROJECT_ID="cvstomize"
SERVICE_NAME="cvstomize-frontend-staging"
REGION="us-central1"

echo "🔍 Fetching Staging API URL..."
API_URL=$(gcloud run services describe cvstomize-api-staging --platform managed --region $REGION --format 'value(status.url)' || echo "")

if [ -z "$API_URL" ]; then
  echo "❌ Could not find Staging API URL. Is the API deployed?"
  read -p "Enter API URL manually (or Ctrl+C to cancel): " API_URL
fi

echo "🚀 Deploying CVstomize Frontend to STAGING..."
echo ""
echo "Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  API URL: $API_URL"
echo ""

# Navigate to root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../"

# Build and deploy using Cloud Build (multi-stage Docker build)
echo "📦 Building Docker image with Cloud Build..."
gcloud builds submit \
  --config=ci/cloudbuild.frontend-staging.yaml \
  --project=$PROJECT_ID \
  --substitutions=_REACT_APP_API_URL="$API_URL" \
  .

echo ""
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --port=8080 \
  --project="$PROJECT_ID" \
  --quiet

echo ""
echo "✅ Staging Frontend Deployment Complete!"
echo ""
echo "🌐 Staging Frontend URL:"
gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format='value(status.url)'

echo ""
echo "📊 Next Steps:"
echo "  1. Test health check: curl <URL>/health"
echo "  2. Open in browser and test end-to-end flow"
echo "  3. Verify it connects to staging API (not production)"
