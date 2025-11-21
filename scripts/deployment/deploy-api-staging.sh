#!/bin/bash
# Deploy Cvstomize API to STAGING environment
# World-class practice: Separate staging project for complete isolation

set -e  # Exit on error

PROJECT_ID="cvstomize"
SERVICE_NAME="cvstomize-api-staging"
REGION="us-central1"
DB_INSTANCE="cvstomize:us-central1:cvstomize-db-staging"

echo "🚀 Deploying to STAGING environment"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Database: $DB_INSTANCE"
echo ""

# Confirm deployment
read -p "Deploy to STAGING? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# Navigate to API directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../api"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=staging" \
  --set-secrets="DATABASE_URL=DATABASE_URL_STAGING:latest,JWT_SECRET=JWT_SECRET_STAGING:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest" \
  --add-cloudsql-instances="$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --max-instances=5 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --quiet

echo ""
echo "✅ Deployment complete!"
# Get the URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo "Staging API URL: $SERVICE_URL"
