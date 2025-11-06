-- Add pdf_template field to resumes table
-- Migration: add_pdf_template
-- Date: 2025-11-06

-- Add pdfTemplate column with default value 'classic'
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS pdf_template VARCHAR(50) DEFAULT 'classic';

-- Add comment for documentation
COMMENT ON COLUMN resumes.pdf_template IS 'PDF template used for resume (classic, modern, minimal)';
