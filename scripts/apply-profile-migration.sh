#!/bin/bash
# Apply personality profiles and stories migration to production database
# Usage: ./scripts/apply-profile-migration.sh

set -e

PROJECT_ID="cvstomize"
INSTANCE_NAME="cvstomize-db"
DATABASE_NAME="cvstomize_production"
MIGRATION_FILE="database/migrations/add_personality_profiles_and_stories.sql"

echo "🔐 Retrieving database password from Secret Manager..."
DB_PASSWORD=$(gcloud secrets versions access latest --secret="DB_POSTGRES_PASSWORD" --project=$PROJECT_ID)

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Failed to retrieve database password"
  exit 1
fi

echo "✅ Password retrieved"
echo ""
echo "📋 Migration Plan:"
echo "  - Add personality_profiles table (hybrid OCEAN assessment)"
echo "  - Add profile_stories table (RAG story system with pgvector)"
echo "  - Add indexes and triggers"
echo "  - Enable pgvector extension"
echo ""
echo "🎯 Target Database:"
echo "  Project: $PROJECT_ID"
echo "  Instance: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo ""
read -p "🚨 Apply migration to PRODUCTION? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🚀 Applying migration..."

# Apply via psql through Cloud SQL Proxy connection
PGPASSWORD="$DB_PASSWORD" psql \
  "host=/cloudsql/$PROJECT_ID:us-central1:$INSTANCE_NAME dbname=$DATABASE_NAME user=postgres" \
  -f "$MIGRATION_FILE" \
  --echo-errors \
  --quiet

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "🔍 Verifying tables..."

  # Verify tables exist
  PGPASSWORD="$DB_PASSWORD" psql \
    "host=/cloudsql/$PROJECT_ID:us-central1:$INSTANCE_NAME dbname=$DATABASE_NAME user=postgres" \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('personality_profiles', 'profile_stories');" \
    --quiet

  echo ""
  echo "✅ Migration complete! New tables ready for use."
else
  echo ""
  echo "❌ Migration failed. Check errors above."
  exit 1
fi
