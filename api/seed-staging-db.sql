-- Staging Database Seeding Script
-- Creates test users and sample data for E2E testing
-- Run against: cvstomize_staging database

-- Test User 1: Free tier (1 resume limit)
INSERT INTO users (id, firebase_uid, email, email_verified, display_name, subscription_tier, resumes_limit, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'staging-test-user-1', 'test1@cvstomize.dev', true, 'Test User Free', 'free', 3, NOW())
ON CONFLICT (firebase_uid) DO NOTHING;

-- Test User 2: Premium tier (15 resume limit)
INSERT INTO users (id, firebase_uid, email, email_verified, display_name, subscription_tier, resumes_limit, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'staging-test-user-2', 'test2@cvstomize.dev', true, 'Test User Premium', 'premium', 15, NOW())
ON CONFLICT (firebase_uid) DO NOTHING;

-- Test User 3: Unlimited tier (for testing upload feature)
INSERT INTO users (id, firebase_uid, email, email_verified, display_name, subscription_tier, resumes_limit, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'staging-test-user-unlimited', 'unlimited@cvstomize.dev', true, 'Test User Unlimited', 'unlimited', 999, NOW())
ON CONFLICT (firebase_uid) DO NOTHING;

-- Verify insertion
SELECT
  firebase_uid,
  email,
  display_name,
  subscription_tier,
  resumes_limit
FROM users
WHERE email LIKE '%cvstomize.dev';
