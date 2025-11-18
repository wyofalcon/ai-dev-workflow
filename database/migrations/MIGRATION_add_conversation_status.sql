-- Migration: Add status tracking columns to conversations table
-- Created: 2025-11-07 (Session 19)
-- Status: PENDING - Apply after staging environment is set up and tested
--
-- WHY THIS IS NEEDED:
-- Code in conversation.js expects these columns but they don't exist in production database
-- This caused "Database Error" when starting conversations
--
-- WHAT WE DID AS HOTFIX:
-- 1. Removed status/completedAt from code (conversation.js)
-- 2. Commented out fields in Prisma schema
-- This allowed conversation to work but we lost status tracking functionality
--
-- PROPER MIGRATION PROCESS:
-- 1. Set up staging environment
-- 2. Test this migration on staging
-- 3. Verify conversation flow works with new columns
-- 4. Apply to production
-- 5. Uncomment fields in schema.prisma
-- 6. Deploy code that uses these columns

-- ==== MIGRATION SQL ====

BEGIN;

-- Add missing columns with defaults
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing conversations as active
UPDATE conversations
SET status = 'active'
WHERE status IS NULL;

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE conversations TO cvstomize_app;

COMMIT;

-- ==== VERIFICATION ====
-- Run after migration:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'conversations'
-- ORDER BY ordinal_position;

-- ==== SCHEMA.PRISMA UPDATES ====
-- After successful migration, uncomment these lines in api/prisma/schema.prisma:
-- status                String    @default("active")
-- completedAt           DateTime? @map("completed_at")
-- updatedAt             DateTime  @updatedAt @map("updated_at")
--
-- Then run: npx prisma generate

-- ==== CODE UPDATES ====
-- After schema update, uncomment status tracking in api/routes/conversation.js:
-- Line 144: status: 'active'
-- Line 332: status: nextQuestionData ? 'active' : 'completed'
-- Line 333: completedAt: nextQuestionData ? null : new Date()
