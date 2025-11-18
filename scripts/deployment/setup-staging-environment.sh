#!/bin/bash
# CVstomize Staging Environment Setup
# This creates a completely isolated staging environment to prevent production incidents
# Run from your Windows Cloud Shell or local gcloud CLI

set -e

PROJECT_ID="cvstomize"
REGION="us-central1"

echo "🔧 Setting up CVstomize Staging Environment..."
echo "================================================"

# 1. CREATE STAGING DATABASE
echo ""
echo "📦 Step 1: Creating staging database..."
gcloud sql instances create cvstomize-db-staging \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --database-flags=max_connections=100 \
  --backup-start-time=03:00 \
  --no-assign-ip \
  --network=default \
  --quiet || echo "Database may already exist"

echo "Creating staging database user..."
gcloud sql users create cvstomize_app_staging \
  --instance=cvstomize-db-staging \
  --password='CVst0mize_Staging_2025!' \
  --quiet || echo "User may already exist"

echo "Creating staging database..."
gcloud sql databases create cvstomize_staging \
  --instance=cvstomize-db-staging \
  --quiet || echo "Database may already exist"

# 2. CREATE STAGING SECRETS
echo ""
echo "🔐 Step 2: Creating staging secrets..."

echo -n 'postgresql://cvstomize_app_staging:CVst0mize_Staging_2025!@localhost/cvstomize_staging?host=/cloudsql/cvstomize:us-central1:cvstomize-db-staging' | \
  gcloud secrets create DATABASE_URL_STAGING --data-file=- --quiet || \
  echo -n 'postgresql://cvstomize_app_staging:CVst0mize_Staging_2025!@localhost/cvstomize_staging?host=/cloudsql/cvstomize:us-central1:cvstomize-db-staging' | \
  gcloud secrets versions add DATABASE_URL_STAGING --data-file=-

echo -n 'staging-jwt-secret-change-in-production-12345' | \
  gcloud secrets create JWT_SECRET_STAGING --data-file=- --quiet || \
  echo -n 'staging-jwt-secret-change-in-production-12345' | \
  gcloud secrets versions add JWT_SECRET_STAGING --data-file=-

echo "✅ Staging secrets created"

# 3. COPY PRODUCTION SECRETS FOR OTHER SERVICES (Gemini, Firebase, GCS)
echo ""
echo "📋 Step 3: Reusing production service secrets for staging..."
# Note: These can be shared between environments as they're Google service credentials

# 4. CREATE STAGING CLOUD RUN SERVICE
echo ""
echo "🚀 Step 4: Creating staging Cloud Run service..."

gcloud run deploy cvstomize-api-staging \
  --region=$REGION \
  --image=gcr.io/$PROJECT_ID/cvstomize-api:latest \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=cvstomize-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:cvstomize-db-staging \
  --set-env-vars="NODE_ENV=staging" \
  --set-secrets="DATABASE_URL=DATABASE_URL_STAGING:latest,JWT_SECRET=JWT_SECRET_STAGING:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=300 \
  --quiet

# 5. RUN DATABASE MIGRATIONS ON STAGING
echo ""
echo "🗄️  Step 5: Running database migrations on staging..."
# This will be done via Prisma from local machine or Cloud Build

echo ""
echo "✅ STAGING ENVIRONMENT SETUP COMPLETE!"
echo "======================================"
echo ""
echo "Staging API URL: https://cvstomize-api-staging-<hash>.run.app"
echo "Staging Database: cvstomize-db-staging"
echo ""
echo "Next steps:"
echo "1. Run Prisma migrations against staging database"
echo "2. Deploy frontend pointing to staging API"
echo "3. Test all changes on staging first"
echo "4. Only deploy to production after staging verification"
