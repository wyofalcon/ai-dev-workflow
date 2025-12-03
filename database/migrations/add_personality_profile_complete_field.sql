-- Add personality_profile_complete field to users table
-- This tracks completion of the GOLD STANDARD personality assessment

ALTER TABLE users
ADD COLUMN IF NOT EXISTS personality_profile_complete BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.personality_profile_complete IS 'Has user completed the Gold Standard personality assessment (premium feature)';
