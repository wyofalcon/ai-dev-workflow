-- Phase 7: Outcome Tracking Foundation (Data Moat)
-- Migration: add_outcome_tracking
-- Date: 2025-11-06
-- Purpose: Track resume outcomes (interviews, offers, salaries) for competitive data moat

-- Add outcome tracking fields
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS interview_received BOOLEAN DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS interview_received_at TIMESTAMP DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS job_offer_received BOOLEAN DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS job_offer_received_at TIMESTAMP DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS salary_offered DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS outcome_reported_at TIMESTAMP DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS outcome_notes TEXT DEFAULT NULL;

-- Add engagement metrics
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS viewed_count INTEGER DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS shared_count INTEGER DEFAULT 0;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP DEFAULT NULL;
