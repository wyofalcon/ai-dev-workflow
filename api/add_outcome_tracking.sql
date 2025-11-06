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

-- Add comments for documentation
COMMENT ON COLUMN resumes.interview_received IS 'Did user get an interview from this resume?';
COMMENT ON COLUMN resumes.interview_received_at IS 'Date user reported getting interview';
COMMENT ON COLUMN resumes.job_offer_received IS 'Did user get a job offer from this resume?';
COMMENT ON COLUMN resumes.job_offer_received_at IS 'Date user reported getting offer';
COMMENT ON COLUMN resumes.salary_offered IS 'Salary offered (for market data)';
COMMENT ON COLUMN resumes.outcome_reported_at IS 'When user reported this outcome';
COMMENT ON COLUMN resumes.outcome_notes IS 'User notes about outcome (optional)';
COMMENT ON COLUMN resumes.viewed_count IS 'Number of times resume was viewed/downloaded';
COMMENT ON COLUMN resumes.shared_count IS 'Number of times resume was shared';
COMMENT ON COLUMN resumes.last_viewed_at IS 'Last time resume was viewed';

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_resumes_interview_received ON resumes(interview_received) WHERE interview_received IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resumes_offer_received ON resumes(job_offer_received) WHERE job_offer_received IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resumes_outcome_reported ON resumes(outcome_reported_at) WHERE outcome_reported_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resumes_salary ON resumes(salary_offered) WHERE salary_offered IS NOT NULL;

-- Index for engagement analytics
CREATE INDEX IF NOT EXISTS idx_resumes_viewed_count ON resumes(viewed_count);
CREATE INDEX IF NOT EXISTS idx_resumes_last_viewed ON resumes(last_viewed_at) WHERE last_viewed_at IS NOT NULL;
