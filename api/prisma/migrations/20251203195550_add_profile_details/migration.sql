-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "current_title" TEXT,
ADD COLUMN     "education_details" JSONB,
ADD COLUMN     "experience_details" JSONB,
ADD COLUMN     "professional_summary" TEXT;
