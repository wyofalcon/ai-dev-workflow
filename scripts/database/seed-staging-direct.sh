#!/bin/bash
# Seed Staging Database - Direct Cloud SQL Execution
# Uses gcloud sql execute to avoid proxy setup

set -e

echo "🌱 Seeding Staging Database (cvstomize-staging)..."

# Create temp SQL file with seed data
cat > /tmp/staging-seed.sql << 'EOSQL'
-- Seed staging database with test users
INSERT INTO users (id, firebase_uid, email, email_verified, display_name, subscription_tier, resumes_limit, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'staging-test-user-1', 'test1@cvstomize.dev', true, 'Test User Free', 'free', 3, NOW()),
  ('00000000-0000-0000-0000-000000000002', 'staging-test-user-2', 'test2@cvstomize.dev', true, 'Test User Premium', 'premium', 15, NOW()),
  ('00000000-0000-0000-0000-000000000003', 'staging-test-user-unlimited', 'unlimited@cvstomize.dev', true, 'Test User Unlimited', 'unlimited', 999, NOW())
ON CONFLICT (firebase_uid) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  subscription_tier = EXCLUDED.subscription_tier,
  resumes_limit = EXCLUDED.resumes_limit;
EOSQL

echo "📝 Executing SQL via gcloud..."

# Execute using gcloud sql execute (requires password input)
gcloud sql connect cvstomize-db-staging \
  --user=cvstomize_app \
  --database=cvstomize_staging \
  --project=cvstomize-staging \
  --quiet < /tmp/staging-seed.sql

echo ""
echo "✅ Staging database seeded successfully!"
echo ""
echo "📋 Test users created:"
echo "  1. test1@cvstomize.dev (Free tier - 3 resumes)"
echo "  2. test2@cvstomize.dev (Premium - 15 resumes)"
echo "  3. unlimited@cvstomize.dev (Unlimited - 999 resumes)"
echo ""
echo "🔑 Next step: Generate test token"
echo "   cd /mnt/storage/shared_windows/Cvstomize/api"
echo "   node create-staging-test-token.js staging-test-user-unlimited"
echo ""

# Cleanup
rm -f /tmp/staging-seed.sql
