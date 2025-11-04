-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "photo_url" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "resumes_generated" INTEGER NOT NULL DEFAULT 0,
    "resumes_limit" INTEGER NOT NULL DEFAULT 1,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "gdpr_consent" BOOLEAN NOT NULL DEFAULT false,
    "gdpr_consent_date" TIMESTAMP(3),
    "data_retention_until" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedin_url" TEXT,
    "years_experience" INTEGER,
    "career_level" TEXT,
    "target_roles" TEXT[],
    "industries" TEXT[],
    "skills" TEXT[],
    "education_level" TEXT,
    "certifications" TEXT[],
    "languages" TEXT[],
    "work_preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_traits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "openness" INTEGER,
    "conscientiousness" INTEGER,
    "extraversion" INTEGER,
    "agreeableness" INTEGER,
    "neuroticism" INTEGER,
    "work_style" TEXT,
    "communication_style" TEXT,
    "confidence" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "messages" JSONB[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "job_title" TEXT NOT NULL,
    "job_description" TEXT,
    "resume_content" JSONB,
    "pdf_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "gemini_prompt" TEXT,
    "gemini_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_user_id" TEXT,
    "referral_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reward_granted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT,
    "platform" TEXT NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viral_metrics" (
    "id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viral_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "response_status" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "gemini_tokens" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_versions" (
    "version" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("version")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "personality_traits_user_id_key" ON "personality_traits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referral_code_key" ON "referrals"("referral_code");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_traits" ADD CONSTRAINT "personality_traits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

