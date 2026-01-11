-- Add missing columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN professional_summary TEXT,
ADD COLUMN current_title VARCHAR(255),
ADD COLUMN education_details JSONB,
ADD COLUMN experience_details JSONB;
