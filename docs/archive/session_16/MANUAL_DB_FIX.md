# Manual Database Permission Fix

**Issue:** `cvstomize_app` user needs ALTER TABLE permission on `resumes` table
**Time Required:** 5 minutes
**Priority:** HIGH - Blocks Phase 7 migration completion

---

## Option 1: Using Google Cloud Console (EASIEST)

### Step 1: Connect to Cloud SQL
1. Go to: https://console.cloud.google.com/sql/instances
2. Click on `cvstomize-db`
3. Click **"DATABASES"** tab
4. Click on `cvstomize_production`
5. Click **"OPEN IN CLOUD SHELL"** button

### Step 2: Run Permission Fix
```sql
-- Connect to the database
\c cvstomize_production

-- Change table ownership to cvstomize_app
ALTER TABLE resumes OWNER TO cvstomize_app;
ALTER TABLE users OWNER TO cvstomize_app;
ALTER TABLE personality_traits OWNER TO cvstomize_app;
ALTER TABLE conversations OWNER TO cvstomize_app;
ALTER TABLE conversation_turns OWNER TO cvstomize_app;

-- Verify ownership
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';

-- Exit
\q
```

### Step 3: Run Migration
```bash
gcloud run jobs execute cvstomize-migrate --region us-central1 --project cvstomize
```

### Step 4: Verify Success
```bash
# Wait 30 seconds, then check logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=cvstomize-migrate" \
  --limit 20 --format="value(textPayload)" --project cvstomize | grep "✅"
```

**Expected Output:**
```
✅ Migration complete: add_pdf_template.sql
✅ Migration complete: add_outcome_tracking.sql
✅ Schema verification complete!
```

---

## Option 2: Using gcloud CLI (If you have postgres password)

### Step 1: Get postgres password
```bash
# If stored in Secret Manager
gcloud secrets versions access latest --secret="postgres-password" --project cvstomize

# Or check deployment notes for password
```

### Step 2: Connect as postgres
```bash
gcloud sql connect cvstomize-db --user=postgres --database=cvstomize_production --project cvstomize
```

### Step 3: Run the same SQL commands from Option 1

---

## Option 3: Using Existing Database URL with Prisma

If the database is accessible from your local machine, you can run migrations using Prisma:

### Step 1: Update DATABASE_URL temporarily
```bash
cd /mnt/storage/shared_windows/Cvstomize/api
export DATABASE_URL="postgresql://postgres:POSTGRES_PASSWORD@34.67.70.34:5432/cvstomize_production"
```

### Step 2: Run migration via Prisma
```bash
npx prisma db execute --file add_outcome_tracking.sql --schema prisma/schema.prisma
```

---

## Verification Steps

After fixing permissions, verify the migration succeeded:

### Check 1: View logs
```bash
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=cvstomize-migrate" \
  --limit 50 --project cvstomize --format="value(textPayload)"
```

### Check 2: Query database directly
```sql
-- Connect to database (any method)
-- Check if new columns exist
\d resumes

-- Should show these new columns:
-- interview_received      | boolean
-- interview_received_at   | timestamp
-- job_offer_received      | boolean
-- job_offer_received_at   | timestamp
-- salary_offered          | numeric(10,2)
-- outcome_reported_at     | timestamp
-- outcome_notes           | text
-- viewed_count            | integer
-- shared_count            | integer
-- last_viewed_at          | timestamp
```

### Check 3: Test API endpoint
```bash
# This endpoint should work after migration
curl -X POST https://cvstomize-api-351889420459.us-central1.run.app/api/resume/TEST_ID/report-outcome \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interviewReceived": true}'
```

---

## Troubleshooting

### Error: "role 'cvstomize_app' does not exist"
```sql
-- Create the user first
CREATE USER cvstomize_app WITH PASSWORD 'CVst0mize_App_2025!';
GRANT ALL PRIVILEGES ON DATABASE cvstomize_production TO cvstomize_app;
```

### Error: "permission denied for schema public"
```sql
-- Grant schema permissions
GRANT ALL ON SCHEMA public TO cvstomize_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cvstomize_app;
```

### Error: Still getting "must be owner of table"
```sql
-- Make sure you're connected as postgres or a superuser
SELECT current_user;  -- Should show 'postgres' or superuser

-- If not, reconnect:
\c cvstomize_production postgres
```

---

## After Successful Migration

Once permissions are fixed and migration completes:

1. ✅ Phase 7 database schema complete
2. ✅ All API endpoints fully functional
3. ✅ Ready for end-to-end testing
4. ✅ Frontend integration can begin

---

## Files Reference

**Migration Files:**
- `/mnt/storage/shared_windows/Cvstomize/api/add_pdf_template.sql` ✅ APPLIED
- `/mnt/storage/shared_windows/Cvstomize/api/add_outcome_tracking.sql` ⏳ PENDING

**Migration Runner:**
- `/mnt/storage/shared_windows/Cvstomize/api/run-migrations.js`

**Documentation:**
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Complete deployment status
- [SESSION_16_DEPLOYMENT.md](SESSION_16_DEPLOYMENT.md) - Session summary

---

**Next Steps After Fix:**
1. Run end-to-end tests (see DEPLOYMENT_STATUS.md)
2. Test outcome tracking endpoints
3. Begin frontend Phase 7 integration

---

**Questions?** See [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for complete deployment details.
