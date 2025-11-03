#!/bin/bash
# Deploy script with verbose logging and database test endpoints

set -e

echo "=== CVstomize API Deployment with Debug Logging ==="
echo ""

# Step 1: Update DATABASE_URL secret for Cloud SQL Proxy
echo "📝 Step 1: Updating DATABASE_URL secret for Cloud SQL Proxy..."
echo -n "postgresql://cvstomize_app:CVst0mize_App_2025!@localhost/cvstomize?host=/cloudsql/cvstomize:us-central1:cvstomize-db&schema=public" | \
  gcloud secrets versions add cvstomize-db-url --data-file=-

echo "✅ DATABASE_URL secret updated with Unix socket path"
echo ""

# Step 2: Build Docker image
echo "🐳 Step 2: Building Docker image..."
CACHEBUST=$(date +%s)
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api \
  --build-arg CACHEBUST=$CACHEBUST

echo "✅ Docker image built successfully"
echo ""

# Step 3: Deploy to Cloud Run
echo "🚀 Step 3: Deploying to Cloud Run..."
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances="cvstomize:us-central1:cvstomize-db" \
  --set-secrets="DATABASE_URL=cvstomize-db-url:latest,GCP_PROJECT_ID=cvstomize-project-id:latest"

echo "✅ Deployment complete"
echo ""

# Step 4: Test endpoints
echo "🧪 Step 4: Testing endpoints..."
SERVICE_URL=$(gcloud run services describe cvstomize-api --region us-central1 --format='value(status.url)')

echo ""
echo "Testing health endpoint..."
curl -s "${SERVICE_URL}/health" | jq '.'

echo ""
echo "Testing database connection..."
curl -s "${SERVICE_URL}/api/auth/test/db" | jq '.'

echo ""
echo "=== Deployment Complete ==="
echo "Service URL: $SERVICE_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Check logs: gcloud run services logs read cvstomize-api --limit=50"
echo "2. Test with Firebase token from browser"
echo "3. Monitor for error messages in logs"
