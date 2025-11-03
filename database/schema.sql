-- CVstomize Database Schema
-- PostgreSQL 15
-- Created: 2025-02-02
-- Description: Production schema for CVstomize v2.0 - AI-powered resume builder

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: users
-- Core user accounts linked to Firebase Authentication
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(255),
  photo_url TEXT,
  auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'github'
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  resumes_generated INTEGER DEFAULT 0,
  resumes_limit INTEGER DEFAULT 1, -- Free tier: 1 resume with social share gate
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  gdpr_consent BOOLEAN DEFAULT FALSE,
  gdpr_consent_date TIMESTAMP WITH TIME ZONE,
  data_retention_until TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- TABLE 2: user_profiles
-- Detailed user profile information collected via conversation
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Personal Information
  full_name VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,

  -- Professional Summary
  current_title VARCHAR(255),
  years_experience INTEGER,
  target_role VARCHAR(255),
  career_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'executive'

  -- Education
  education JSONB, -- Array of education objects

  -- Experience
  experience JSONB, -- Array of work experience objects

  -- Skills
  technical_skills TEXT[], -- Array of technical skills
  soft_skills TEXT[], -- Array of soft skills
  certifications TEXT[], -- Array of certifications
  languages TEXT[], -- Array of languages with proficiency

  -- Profile Metadata
  profile_completeness INTEGER DEFAULT 0, -- 0-100 percentage
  conversation_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_profile UNIQUE(user_id)
);

CREATE INDEX idx_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_profiles_completeness ON user_profiles(profile_completeness);

-- =====================================================
-- TABLE 3: personality_traits
-- Big Five personality traits inferred from conversation
-- =====================================================
CREATE TABLE personality_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Big Five Personality Traits (0-100 scale)
  openness INTEGER CHECK (openness BETWEEN 0 AND 100),
  conscientiousness INTEGER CHECK (conscientiousness BETWEEN 0 AND 100),
  extraversion INTEGER CHECK (extraversion BETWEEN 0 AND 100),
  agreeableness INTEGER CHECK (agreeableness BETWEEN 0 AND 100),
  neuroticism INTEGER CHECK (neuroticism BETWEEN 0 AND 100),

  -- Derived Work Style Preferences
  work_style VARCHAR(50), -- 'collaborative', 'independent', 'hybrid'
  leadership_style VARCHAR(50), -- 'servant', 'democratic', 'transformational', 'none'
  communication_style VARCHAR(50), -- 'direct', 'diplomatic', 'analytical', 'expressive'
  motivation_type VARCHAR(50), -- 'achievement', 'autonomy', 'mastery', 'purpose'
  decision_making VARCHAR(50), -- 'analytical', 'intuitive', 'consultative'

  -- Confidence & Metadata
  inference_confidence FLOAT CHECK (inference_confidence BETWEEN 0 AND 1), -- 0.0-1.0
  analysis_version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_traits UNIQUE(user_id)
);

CREATE INDEX idx_traits_user_id ON personality_traits(user_id);

-- =====================================================
-- TABLE 4: conversations
-- Chat conversation history for profile building
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,

  -- Message Content
  message_role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  message_content TEXT NOT NULL,
  message_order INTEGER NOT NULL,

  -- Question Metadata
  question_id VARCHAR(50), -- e.g., 'career_foundation_1'
  question_category VARCHAR(100), -- 'Career Foundation', 'Achievement Stories', etc.

  -- AI Metadata
  model_used VARCHAR(50), -- 'gemini-1.5-flash'
  tokens_used INTEGER,
  response_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- =====================================================
-- TABLE 5: resumes
-- Generated resume metadata and storage links
-- =====================================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Resume Details
  title VARCHAR(255) NOT NULL,
  target_company VARCHAR(255),
  job_description TEXT,

  -- Generated Content
  resume_markdown TEXT, -- Markdown format
  resume_html TEXT, -- HTML format for preview

  -- File Storage
  pdf_url TEXT, -- Cloud Storage signed URL
  pdf_bucket VARCHAR(255),
  pdf_path VARCHAR(500),

  -- Generation Metadata
  model_used VARCHAR(50), -- 'gemini-1.5-pro'
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generated', 'downloaded', 'shared'
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);

-- =====================================================
-- TABLE 6: subscriptions
-- User subscription plans and payment tracking
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Subscription Details
  tier VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trial'

  -- Payment Info (for future Stripe integration)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Pricing
  price_usd DECIMAL(10, 2),
  billing_cycle VARCHAR(50), -- 'monthly', 'yearly'

  -- Limits
  resume_limit INTEGER,
  features JSONB, -- JSON object of enabled features

  -- Dates
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- =====================================================
-- TABLE 7: referrals
-- Referral tracking for viral growth
-- =====================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referrer (who sent the invite)
  referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,

  -- Referee (who signed up via referral)
  referee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referee_email VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'

  -- Rewards
  reward_type VARCHAR(50), -- 'resume_credits', 'discount', 'upgrade'
  reward_value INTEGER,
  reward_claimed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referee_user_id ON referrals(referee_user_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- =====================================================
-- TABLE 8: social_shares
-- Social sharing tracking for viral gate
-- =====================================================
CREATE TABLE social_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,

  -- Share Details
  platform VARCHAR(50) NOT NULL, -- 'linkedin', 'twitter', 'reddit', 'facebook'
  share_url TEXT,
  share_message TEXT,

  -- Tracking
  clicked BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE, -- Honor system verification

  -- Referral Tracking
  referral_code VARCHAR(50),
  referral_clicks INTEGER DEFAULT 0,
  referral_signups INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX idx_social_shares_resume_id ON social_shares(resume_id);
CREATE INDEX idx_social_shares_platform ON social_shares(platform);
CREATE INDEX idx_social_shares_referral_code ON social_shares(referral_code);

-- =====================================================
-- TABLE 9: viral_metrics
-- Daily viral coefficient calculations
-- =====================================================
CREATE TABLE viral_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Date
  metric_date DATE NOT NULL UNIQUE,

  -- User Metrics
  new_signups INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,

  -- Sharing Metrics
  total_shares INTEGER DEFAULT 0,
  shares_linkedin INTEGER DEFAULT 0,
  shares_twitter INTEGER DEFAULT 0,
  shares_reddit INTEGER DEFAULT 0,
  shares_facebook INTEGER DEFAULT 0,

  -- Referral Metrics
  referral_signups INTEGER DEFAULT 0,
  referral_conversions INTEGER DEFAULT 0,

  -- Viral Coefficient
  viral_coefficient DECIMAL(5, 3), -- Average referrals per user

  -- Conversion Funnel
  visitors INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  profiles_completed INTEGER DEFAULT 0,
  resumes_generated INTEGER DEFAULT 0,
  shares_completed INTEGER DEFAULT 0,

  -- Costs
  total_cost_usd DECIMAL(10, 2),
  cost_per_user DECIMAL(10, 4),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_viral_metrics_date ON viral_metrics(metric_date DESC);

-- =====================================================
-- TABLE 10: audit_logs
-- GDPR compliance and security auditing
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- 'user.created', 'user.login', 'data.exported', 'data.deleted'
  event_category VARCHAR(50), -- 'auth', 'data', 'billing', 'admin'

  -- Event Data
  event_data JSONB, -- JSON object with event details

  -- Request Metadata
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,

  -- Status
  status VARCHAR(50), -- 'success', 'failure', 'error'
  error_message TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);

-- =====================================================
-- TABLE 11: api_usage
-- Track API usage and costs for monitoring
-- =====================================================
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- API Details
  api_name VARCHAR(100) NOT NULL, -- 'gemini-1.5-flash', 'gemini-1.5-pro'
  endpoint VARCHAR(255),
  operation VARCHAR(100), -- 'conversation', 'resume_generation', 'personality_analysis'

  -- Usage Metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,

  -- Cost
  cost_usd DECIMAL(10, 6),

  -- Performance
  response_time_ms INTEGER,
  status VARCHAR(50), -- 'success', 'error', 'timeout'

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_api_name ON api_usage(api_name);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Apply updated_at function to relevant tables
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
-- INITIAL DATA
-- =====================================================

-- Insert default viral metrics row for today
INSERT INTO viral_metrics (metric_date, total_users, new_signups)
VALUES (CURRENT_DATE, 0, 0)
ON CONFLICT (metric_date) DO NOTHING;

-- =====================================================
-- SCHEMA VERSION
-- =====================================================
CREATE TABLE schema_version (
  version VARCHAR(20) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial schema: users, profiles, personality traits, conversations, resumes, subscriptions, referrals, social shares, viral metrics, audit logs, api usage');

-- =====================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- Total Tables: 13 (11 core + 1 schema_version + 1 more with extensions)
-- Total Indexes: 35+
-- Total Triggers: 5
-- Total Functions: 1
-- =====================================================
