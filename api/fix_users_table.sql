-- Fix users table schema to match Prisma schema
-- Run this in GCP Console: https://console.cloud.google.com/sql/instances/cvstomize-db/queries?project=cvstomize

-- Check current table structure first
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Add missing columns (if they don't exist)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMP(3);

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
