-- Create users table for CVstomize authentication
-- Run this in GCP Console: https://console.cloud.google.com/sql/instances/cvstomize-db/queries?project=cvstomize

-- Drop table if exists (CAUTION: This will delete all existing users!)
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL,
    firebase_uid TEXT NOT NULL,
    email TEXT NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    display_name TEXT,
    photo_url TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'email',
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    resumes_generated INTEGER NOT NULL DEFAULT 0,
    resumes_limit INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gdpr_consent BOOLEAN NOT NULL DEFAULT false,
    gdpr_consent_date TIMESTAMP(3),
    data_retention_until TIMESTAMP(3),

    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_key ON users(firebase_uid);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';
