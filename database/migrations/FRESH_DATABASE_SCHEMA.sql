-- CVstomize Fresh Database Schema
-- Generated from Prisma schema to match code exactly
-- Created: 2025-11-07 (Session 19 - Fresh Start)
--
-- WHY FRESH START:
-- - Database schema was out of sync with Prisma/code
-- - Multiple failed hotfixes trying to patch differences
-- - No production data to lose (database is empty)
-- - Faster to start clean than debug schema drift
--
-- This creates a database that EXACTLY matches the Prisma schema

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing tables (clean slate)
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS viral_metrics CASCADE;
DROP TABLE IF EXISTS social_shares CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS personality_traits CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_versions CASCADE;

-- =====================================================
-- TABLE 1: users
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(255),
  photo_url TEXT,
  auth_provider VARCHAR(50) DEFAULT 'email',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  resumes_generated INTEGER DEFAULT 0,
  resumes_limit INTEGER DEFAULT 1,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMP WITH TIME ZONE,
  data_retention_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- TABLE 2: user_profiles
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin_url TEXT,
  years_experience INTEGER,
  career_level VARCHAR(50),
  target_roles TEXT[],
  industries TEXT[],
  skills TEXT[],
  education_level VARCHAR(50),
  certifications TEXT[],
  languages TEXT[],
  work_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- TABLE 3: personality_traits
-- =====================================================
CREATE TABLE personality_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  openness INTEGER,
  conscientiousness INTEGER,
  extraversion INTEGER,
  agreeableness INTEGER,
  neuroticism INTEGER,
  work_style VARCHAR(50),
  communication_style VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_traits_user_id ON personality_traits(user_id);

-- =====================================================
-- TABLE 4: conversations (FIXED FOR PRISMA)
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  messages JSONB[] DEFAULT '{}',
  -- TODO: Uncomment after testing if we want status tracking
  -- status VARCHAR(50) DEFAULT 'active',
  -- completed_at TIMESTAMP WITH TIME ZONE,
  -- updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- =====================================================
-- TABLE 5: resumes
-- =====================================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_company VARCHAR(255),
  job_description TEXT,
  resume_markdown TEXT,
  resume_html TEXT,
  pdf_url TEXT,
  pdf_bucket VARCHAR(255),
  pdf_path VARCHAR(500),
  pdf_template VARCHAR(50) DEFAULT 'classic',
  model_used VARCHAR(50),
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE,
  -- Outcome tracking
  interview_received BOOLEAN,
  interview_received_at TIMESTAMP WITH TIME ZONE,
  job_offer_received BOOLEAN,
  job_offer_received_at TIMESTAMP WITH TIME ZONE,
  salary_offered DECIMAL(10, 2),
  outcome_reported_at TIMESTAMP WITH TIME ZONE,
  outcome_notes TEXT,
  -- Engagement
  viewed_count INTEGER DEFAULT 0,
  shared_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);

-- =====================================================
-- TABLE 6: subscriptions
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- =====================================================
-- TABLE 7: referrals
-- =====================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reward_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- =====================================================
-- TABLE 8: social_shares
-- =====================================================
CREATE TABLE social_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0
);

CREATE INDEX idx_social_shares_user_id ON social_shares(user_id);

-- =====================================================
-- TABLE 9: viral_metrics
-- =====================================================
CREATE TABLE viral_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(100) NOT NULL,
  value FLOAT NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE 10: audit_logs
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TABLE 11: api_usage
-- =====================================================
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_status INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  gemini_tokens INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp);

-- =====================================================
-- TABLE 12: schema_versions
-- =====================================================
CREATE TABLE schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_traits_updated_at BEFORE UPDATE ON personality_traits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cvstomize_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cvstomize_app;

-- =====================================================
-- INITIAL DATA
-- =====================================================

INSERT INTO schema_versions (version, description) VALUES
(1, 'Fresh start - Schema generated from Prisma (Session 19)');

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run after applying:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversations';
