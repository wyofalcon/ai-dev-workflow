-- =====================================================
-- CHECK: Verify if onboarding_completed column exists
-- Date: 2025-12-03
-- Purpose: Confirm root cause before applying fix
-- =====================================================

-- Check if column exists in users table
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    ) THEN '✅ COLUMN EXISTS - Issue is NOT missing column'
    ELSE '❌ COLUMN MISSING - This is the root cause!'
  END as diagnosis;

-- Show all columns in users table
\echo '\n📋 Current users table columns:'
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check for similar column names (camelCase vs snake_case)
\echo '\n🔍 Checking for similar column names:'
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND (column_name LIKE '%onboard%' OR column_name LIKE '%complete%')
ORDER BY column_name;

-- Show recent users to see what fields they have
\echo '\n👥 Sample user records (checking for onboarding field):'
SELECT
  id,
  email,
  created_at,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    )
    THEN (SELECT onboarding_completed FROM users u WHERE u.id = users.id LIMIT 1)::text
    ELSE 'FIELD DOES NOT EXIST'
  END as onboarding_status
FROM users
ORDER BY created_at DESC
LIMIT 5;
