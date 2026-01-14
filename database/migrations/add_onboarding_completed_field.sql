-- =====================================================
-- MIGRATION: Add onboarding_completed field to users table
-- Date: 2025-12-03
-- Purpose: Fix onboarding completion 500 error
-- =====================================================

-- Check if column already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

    -- Add comment for documentation
    COMMENT ON COLUMN users.onboarding_completed IS 'Tracks whether user has completed initial onboarding flow';

    RAISE NOTICE 'Column onboarding_completed added successfully';
  ELSE
    RAISE NOTICE 'Column onboarding_completed already exists, skipping';
  END IF;
END $$;

-- Create index for faster queries filtering by onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
  ON users(onboarding_completed)
  WHERE onboarding_completed = FALSE;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify column exists
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Count users by onboarding status
SELECT
  onboarding_completed,
  COUNT(*) as user_count
FROM users
GROUP BY onboarding_completed;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration:
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- DROP INDEX IF EXISTS idx_users_onboarding_completed;
