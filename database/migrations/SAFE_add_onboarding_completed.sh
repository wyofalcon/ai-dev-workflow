#!/bin/bash
#
# SAFE Migration: Add onboarding_completed field if missing
# This script checks first, then only applies fix if needed
#

set -e

PROJECT_ID="cvstomize"
DB_INSTANCE="cvstomize-db"
DB_NAME="cvstomize_production"
DB_USER="cvstomize_app"

echo "🔍 CVstomize Database Migration: onboarding_completed field"
echo "==========================================================="
echo ""
echo "⚠️  WARNING: This will modify the production database"
echo "Project: $PROJECT_ID"
echo "Database: $DB_INSTANCE"
echo "Schema: $DB_NAME"
echo ""

# Confirm before proceeding
read -p "Continue with migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 1
fi

echo ""
echo "🔍 Step 1: Checking if column exists..."
echo ""

# Create temporary SQL file for check
cat > /tmp/check_column.sql <<'SQL'
SELECT CASE
  WHEN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN 'EXISTS'
  ELSE 'MISSING'
END as column_status;
SQL

# Execute check (will prompt for password)
echo "Checking column status..."
echo "You will be prompted for the database password"
echo ""

COLUMN_STATUS=$(gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME --project=$PROJECT_ID < /tmp/check_column.sql 2>&1 | grep -E "EXISTS|MISSING" | tr -d ' ')

if [ "$COLUMN_STATUS" == "EXISTS" ]; then
  echo "✅ Column onboarding_completed already exists!"
  echo ""
  echo "The issue is NOT a missing column."
  echo "Check these instead:"
  echo "  1. Check API logs for actual error message"
  echo "  2. Verify Prisma client is up to date: npx prisma generate"
  echo "  3. Check if there's a data type mismatch"
  echo "  4. Verify database permissions"
  echo ""
  exit 0
fi

echo "❌ Column onboarding_completed is MISSING"
echo ""
echo "🔧 Step 2: Adding column..."
echo ""

# Create migration SQL
cat > /tmp/add_column.sql <<'SQL'
-- Add onboarding_completed column
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN users.onboarding_completed IS 'Tracks whether user has completed initial onboarding flow';

-- Create index
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed) WHERE onboarding_completed = FALSE;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

SELECT 'Column added successfully!' as status;
SQL

# Execute migration
echo "Applying migration..."
echo "You will be prompted for the database password again"
echo ""

gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME --project=$PROJECT_ID < /tmp/add_column.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Next steps:"
echo "  1. Verify column exists: SELECT * FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_completed';"
echo "  2. Test onboarding completion in production app"
echo "  3. Check API logs for success messages"
echo ""

# Cleanup
rm -f /tmp/check_column.sql /tmp/add_column.sql
