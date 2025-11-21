#!/bin/bash
# Deploy Cvstomize API to DEV environment
# Uses the main project but with -dev suffixes for isolation within the same project.

set -e

PROJECT_ID="cvstomize"
SERVICE_NAME="cvstomize-api-dev"
REGION="us-central1"
DB_INSTANCE_NAME="cvstomize-db-dev"
DB_INSTANCE_FULL="$PROJECT_ID:$REGION:$DB_INSTANCE_NAME"

echo "🚀 Deploying to DEV environment"
echo "=================================================="
echo "Project:  $PROJECT_ID"
echo "Service:  $SERVICE_NAME"
echo "Database: $DB_INSTANCE_NAME"
echo "=================================================="
echo ""

# 1. Check directory
if [ ! -f "package.json" ] || [ ! -d "routes" ]; then
    echo "⚠️  Error: Please run this script from the 'api' directory."
    echo "   Example: cd api && ../scripts/deployment/deploy-api-dev.sh"
    exit 1
fi

# 2. Check if DB instance exists
echo "🔍 Checking for Cloud SQL instance '$DB_INSTANCE_NAME'..."
if ! gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
    echo "❌ Error: Cloud SQL instance '$DB_INSTANCE_NAME' not found in project '$PROJECT_ID'."
    echo "   You need to create the dev database instance first."
    echo "   Or update this script to use a different database."
    exit 1
fi
echo "✅ Database instance found."

# 3. Confirm deployment
read -p "Ready to deploy to DEV? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# 4. Deploy to Cloud Run
echo "📦 Building and Deploying..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --project="$PROJECT_ID" \
  --service-account="cvstomize-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars="NODE_ENV=development,LOG_LEVEL=debug" \
  --set-secrets="DATABASE_URL=DATABASE_URL_dev:latest,JWT_SECRET=JWT_SECRET_dev:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME_dev:latest" \
  --add-cloudsql-instances="$DB_INSTANCE_FULL" \
  --max-instances=2 \
  --min-instances=0 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=60s

# 5. Get URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --project=$PROJECT_ID --region=$REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌎 Dev API URL: $SERVICE_URL"
echo ""
echo "🔍 Verify health:"
echo "   curl $SERVICE_URL/health"
