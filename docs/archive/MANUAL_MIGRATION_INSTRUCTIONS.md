# Manual Database Migration Instructions
**Date:** December 3, 2025
**Issue:** Onboarding completion fails with HTTP 500 error
**Root Cause:** Missing `onboarding_completed` column in production database

---

## ✅ Environment Setup Complete

The development environment has been configured with:
- ✅ Git repository synced (dev branch up to date with origin)
- ✅ All 6 Session 31 commits pushed to origin/dev
- ✅ Admin migration endpoint created (committed as 4aa553d)
- ✅ gcloud CLI configured (project: cvstomize)
- ✅ PostgreSQL client (psql) installed
- ✅ Node.js 20 and npm ready

---

## 🔧 Database Migration Required

### The Problem
Prisma schema (line 31 in `api/prisma/schema.prisma`) expects:
```prisma
onboardingCompleted Boolean @default(false) @map("onboarding_completed")
```

But the production database table `users` is **missing** the `onboarding_completed` column.

---

## 📋 Manual Migration Steps

### Option 1: GCP Cloud SQL Studio (Recommended - Web-Based)

1. **Open Cloud SQL Studio:**
   - Go to: https://console.cloud.google.com/sql/instances/cvstomize-db/edit?project=cvstomize
   - Click "Open Cloud SQL Studio" button
   - Select database: `cvstomize_production`

2. **Run Migration SQL:**
   ```sql
   -- Check if column exists
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'onboarding_completed';

   -- If no results, add the column:
   ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

   -- Add index for performance:
   CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
     ON users(onboarding_completed)
     WHERE onboarding_completed = FALSE;

   -- Verify:
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'onboarding_completed';
   ```

3. **Expected Result:**
   ```
   column_name          | data_type | column_default
   ---------------------|-----------|---------------
   onboarding_completed | boolean   | false
   ```

---

### Option 2: gcloud sql connect (Command Line)

**Note:** This method requires psql and may hang due to firewall/network configuration.

1. **Connect to Database:**
   ```bash
   gcloud sql connect cvstomize-db \\
     --user=cvstomize_app \\
     --database=cvstomize_production \\
     --project=cvstomize
   ```

2. **When prompted for password:**
   ```
   Password: CVstomize_Fresh_2025_2157
   ```

3. **Run Migration:**
   ```sql
   \\i /mnt/storage/shared_windows/Cvstomize/database/migrations/add_onboarding_completed_field.sql
   ```

   Or copy/paste the SQL from the file.

---

### Option 3: Cloud SQL Proxy (Local Connection)

**Prerequisites:**
- Cloud SQL Proxy running locally
- Service account authenticated

1. **Start Cloud SQL Proxy:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/mnt/storage/shared_windows/Cvstomize/gcp-key.json

   cloud-sql-proxy cvstomize:us-central1:cvstomize-db --port=5433 &
   ```

2. **Connect with psql:**
   ```bash
   PGPASSWORD='CVstomize_Fresh_2025_2157' psql \\
     -h localhost \\
     -p 5433 \\
     -U cvstomize_app \\
     -d cvstomize_production \\
     -f database/migrations/add_onboarding_completed_field.sql
   ```

---

### Option 4: Admin Migration Endpoint (Not Working Yet)

**Status:** ❌ Endpoint deployed but not serving traffic (caching issue)

An admin endpoint was created at `/api/admin-migration/` but Cloud Run is not routing to the new revision. This needs investigation.

**Files Created:**
- `api/routes/adminMigration.js` (admin endpoint code)
- Commit: 4aa553d

**When working, usage would be:**
```bash
# Check if column exists
curl -H "x-migration-secret: cvstomize-migration-2025-12-03" \\
  "https://cvstomize-api-351889420459.us-central1.run.app/api/admin-migration/check"

# Apply migration
curl -X POST -H "x-migration-secret: cvstomize-migration-2025-12-03" \\
  "https://cvstomize-api-351889420459.us-central1.run.app/api/admin-migration/apply"
```

---

## ✅ Verification After Migration

### 1. Check Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

### 2. Test Onboarding Completion

**Test Account:**
- Email: test-gold-standard-dec3@example.com
- Password: TestPass123!

**Steps:**
1. Login at: https://cvstomize-frontend-351889420459.us-central1.run.app
2. Navigate through onboarding Steps 1-3
3. Click "COMPLETE SETUP" button on Step 3
4. **Expected:** Success! Redirect to dashboard
5. **Previous Error:** HTTP 500 Internal Server Error

### 3. Check Application Logs
```bash
gcloud logging read 'resource.type=cloud_run_revision \\
  AND resource.labels.service_name=cvstomize-api \\
  AND textPayload=~"Profile update successful"' \\
  --limit=10 --project=cvstomize
```

Look for:
- ✅ Profile upserted successfully
- ✅ Onboarding marked as completed
- 🎉 Profile update successful!

---

## 📊 Migration SQL File Location

**Primary File:** `/mnt/storage/shared_windows/Cvstomize/database/migrations/add_onboarding_completed_field.sql`

**Contains:**
- ✅ Idempotent migration (checks if column exists first)
- ✅ Column addition with DEFAULT FALSE
- ✅ Index creation for performance
- ✅ Verification queries
- ✅ Rollback instructions (if needed)

---

## 🎯 Next Steps After Migration

1. ✅ **Verify Fix** - Test onboarding completion
2. ✅ **Complete Testing** - Run remaining 5/8 test scenarios
   (See: `docs/CLAUDE_CHROME_EXTENSION_TESTING_GUIDE.md`)
3. ✅ **Remove Admin Endpoint** - Delete temporary migration route
4. ✅ **Production Launch** - Announce features to users

---

## 🔗 Related Documentation

- [NEXT_SESSION_PRIORITIES.md](NEXT_SESSION_PRIORITIES.md) - Detailed investigation
- [SESSION_31_FINAL_HANDOFF.md](SESSION_31_FINAL_HANDOFF.md) - Session summary
- [ROADMAP.md](ROADMAP.md) - Project roadmap
- [database/migrations/add_onboarding_completed_field.sql](database/migrations/add_onboarding_completed_field.sql) - Migration SQL

---

## 🚨 Current Blocker Summary

**Problem:** Cannot access Cloud SQL from this development environment
**Workaround:** Use GCP Cloud SQL Studio (web-based) - **RECOMMENDED**
**Alternative:** Cloud SQL Proxy (requires proper authentication setup)

**Recommended Action:** Use **Option 1 (Cloud SQL Studio)** to apply the migration manually.

---

**Last Updated:** December 3, 2025
**Status:** Migration SQL ready, awaiting manual execution
**Priority:** P0 - CRITICAL (blocks all users from completing onboarding)
