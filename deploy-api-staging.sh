#!/bin/bash
# Deploy Cvstomize API to STAGING environment
# World-class practice: Separate staging project for complete isolation

set -e  # Exit on error

PROJECT_ID="cvstomize-staging"
SERVICE_NAME="cvstomize-api-staging"
REGION="us-central1"
DB_INSTANCE="cvstomize-staging:us-central1:cvstomize-db-staging"

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

cd /mnt/storage/shared_windows/Cvstomize/api

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=staging" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GOOGLE_APPLICATION_CREDENTIALS_JSON=GOOGLE_APPLICATION_CREDENTIALS_JSON:latest" \
  --add-cloudsql-instances="$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --max-instances=5 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo "Staging API URL: https://$SERVICE_NAME-$(gcloud config get-value project 2>/dev/null).us-central1.run.app"
