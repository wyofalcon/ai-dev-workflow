-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "is_open_to_work" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recruiter_visibility" TEXT NOT NULL DEFAULT 'anonymous';
