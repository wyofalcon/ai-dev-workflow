-- AlterTable
ALTER TABLE "users" ADD COLUMN     "personality_profile_complete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "personality_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "openness" SMALLINT,
    "conscientiousness" SMALLINT,
    "extraversion" SMALLINT,
    "agreeableness" SMALLINT,
    "neuroticism" SMALLINT,
    "assessment_version" TEXT DEFAULT 'hybrid-v3',
    "confidence_score" DECIMAL(3,2),
    "likert_scores" JSONB,
    "narrative_scores" JSONB,
    "fusion_weights" JSONB DEFAULT '{"likert": 0.7, "narrative": 0.3}',
    "work_style" TEXT,
    "communication_style" TEXT,
    "leadership_style" TEXT,
    "motivation_type" TEXT,
    "decision_making" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "profile_summary" TEXT,
    "key_insights" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "question_type" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "story_text" TEXT NOT NULL,
    "story_summary" TEXT,
    "category" TEXT,
    "themes" TEXT[],
    "skills_demonstrated" TEXT[],
    "personality_signals" JSONB,
    "relevance_tags" TEXT[],
    "times_used_in_resumes" INTEGER NOT NULL DEFAULT 0,
    "times_used_in_cover_letters" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personality_profiles_user_id_key" ON "personality_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_stories" ADD CONSTRAINT "profile_stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_stories" ADD CONSTRAINT "profile_stories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "personality_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
