SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'resumes' 
AND column_name IN (
  'interview_received', 'interview_received_at',
  'job_offer_received', 'job_offer_received_at',
  'salary_offered', 'outcome_reported_at', 'outcome_notes',
  'viewed_count', 'shared_count', 'last_viewed_at',
  'pdf_template'
)
ORDER BY column_name;
