-- Migration: Add messages column to conversations table
-- Date: 2025-11-07
-- Purpose: Fix Prisma schema mismatch - convert from individual message fields to JSON array

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS messages JSONB[] DEFAULT '{}';

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
