-- Migration: add_jd_session_columns
-- Description: Add JD session state columns to conversations table (fixes Issue #17)
-- This replaces in-memory Map storage with persistent database storage

-- Add new JD session columns
ALTER TABLE "conversations" ADD COLUMN "jd_analysis" JSONB;
ALTER TABLE "conversations" ADD COLUMN "jd_questions" JSONB;
ALTER TABLE "conversations" ADD COLUMN "current_question_index" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN "has_resume" BOOLEAN NOT NULL DEFAULT false;

-- Add session lifecycle columns
ALTER TABLE "conversations" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "conversations" ADD COLUMN "completed_at" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create compound unique index for fast session lookups
CREATE UNIQUE INDEX "conversations_user_id_session_id_key" ON "conversations"("user_id", "session_id");

-- Create index on status for filtering active/completed sessions
CREATE INDEX "conversations_status_idx" ON "conversations"("status");
