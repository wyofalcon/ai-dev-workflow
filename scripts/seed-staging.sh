#!/bin/bash
# Seed Staging Database with Test Users
# Usage: ./scripts/seed-staging.sh

set -e

echo "🌱 Seeding Staging Database..."

# Check if Cloud SQL Proxy is running for staging
if ! pgrep -f "cloud-sql-proxy.*cvstomize-staging" > /dev/null; then
  echo "⚠️  Cloud SQL Proxy not detected for staging"
  echo "Starting Cloud SQL Proxy on port 5436..."
  
  cd /mnt/storage/shared_windows/Cvstomize/api
  ./cloud-sql-proxy cvstomize-staging:us-central1:cvstomize-db-staging --port 5436 &
  sleep 3
fi

# Get staging password from Secret Manager
export PGPASSWORD='CVstomize_App_Staging_2025'

# Run seed script
echo "📝 Inserting test users..."
psql -h 127.0.0.1 -p 5436 -U cvstomize_app -d cvstomize_staging -f /mnt/storage/shared_windows/Cvstomize/api/seed-staging-db.sql

echo "✅ Staging database seeded successfully!"
echo ""
echo "Test users created:"
echo "  1. test1@cvstomize.dev (Free tier - 3 resumes)"
echo "  2. test2@cvstomize.dev (Premium - 15 resumes)"
echo "  3. unlimited@cvstomize.dev (Unlimited - 999 resumes)"
echo ""
echo "🔑 To get Firebase test tokens, use Firebase Admin SDK custom token creation"
