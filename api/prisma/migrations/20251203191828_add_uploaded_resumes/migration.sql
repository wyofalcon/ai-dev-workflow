-- CreateTable
CREATE TABLE "uploaded_resumes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "raw_text" TEXT NOT NULL,
    "parsed_data" JSONB,
    "storage_path" TEXT,
    "storage_bucket" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_resumes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "uploaded_resumes" ADD CONSTRAINT "uploaded_resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
