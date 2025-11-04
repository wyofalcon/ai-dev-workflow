-- Fix column name mismatch: last_login -> last_login_at
-- Run this as postgres superuser or table owner

-- Rename the column
ALTER TABLE users RENAME COLUMN last_login TO last_login_at;

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login_at';
