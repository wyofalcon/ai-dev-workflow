# Grant Gold Standard Access to Test Account

**Account:** `claude.test.20250403@example.com`
**Required:** Update subscription tier to `gold` to enable Gold Standard testing

---

## Option 1: Via GCP Console (Easiest)

1. Open GCP Console: https://console.cloud.google.com/sql/instances/cvstomize-db/databases?project=cvstomize

2. Click **"OPEN CLOUD SHELL EDITOR"** button (top right)

3. Connect to database:
```bash
gcloud sql connect cvstomize-db --user=cvstomize_app --database=cvstomize_production
```

4. Enter password when prompted: `CVstomize_Fresh_2025_2157`

5. Run SQL command:
```sql
UPDATE users SET
  subscription_tier = 'gold',
  subscription_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '1 year'
WHERE email = 'claude.test.20250403@example.com';

-- Verify
SELECT email, subscription_tier, subscription_status,
       (SELECT COUNT(*) FROM resumes WHERE user_id = users.id) as resume_count
FROM users
WHERE email = 'claude.test.20250403@example.com';
```

6. Expected output:
```
email                            | subscription_tier | subscription_status | resume_count
claude.test.20250403@example.com | gold             | active              | 1 (or more)
```

7. Exit: `\q`

---

## Option 2: Via Local Script

If you have Cloud SQL proxy running locally:

```bash
cd /mnt/storage/shared_windows/Cvstomize/api

DATABASE_URL="postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@/cloudsql/cvstomize:us-central1:cvstomize-db/cvstomize_production" \
node scripts/grant-gold-access.js "claude.test.20250403@example.com"
```

**Note:** Requires Cloud SQL Auth Proxy running:
```bash
cloud-sql-proxy cvstomize:us-central1:cvstomize-db
```

---

## Option 3: Quick SQL via Cloud Shell

```bash
# One-liner to update via Cloud Shell
echo "UPDATE users SET subscription_tier='gold', subscription_status='active', subscription_start_date=NOW(), subscription_end_date=NOW() + INTERVAL '1 year' WHERE email='claude.test.20250403@example.com';" | \
gcloud sql connect cvstomize-db --user=cvstomize_app --database=cvstomize_production
```

(Enter password: `CVstomize_Fresh_2025_2157` when prompted)

---

## Verification

After updating, verify the change worked:

1. **Via Database:**
```sql
SELECT email, subscription_tier, subscription_status
FROM users
WHERE email = 'claude.test.20250403@example.com';
```

2. **Via Frontend:**
   - Navigate to https://cvstomize-frontend-351889420459.us-central1.run.app
   - Login as `claude.test.20250403@example.com`
   - Dashboard should show "Tailor to Specific Job (Gold Standard)" button as **ENABLED** (gold color, clickable)
   - Click button → should navigate to `/create-resume` (ConversationalWizard)

3. **Via API:**
```bash
# Get user details
curl -H "Authorization: Bearer <firebase-token>" \
  https://cvstomize-api-351889420459.us-central1.run.app/api/profile
```

---

## Testing Gold Standard After Access Granted

Once the account has Gold tier access, follow this test sequence:

### Phase 1: Gold Standard Assessment (30 min)
1. Navigate to `/gold-standard`
2. Complete Section A: 8 behavioral stories (50+ words each)
3. Complete Section B: 20 Likert items (1-5 scale)
4. Complete Section C: 7 hybrid questions (30+ words each)
5. View OCEAN results
6. Verify embeddings created in database

### Phase 2: Gold Standard Resume Generation (45 min)
1. Click "Tailor to Specific Job (Gold Standard)" on dashboard
2. Paste job description
3. Test NEW resume paste textarea (Session 32 feature!)
4. Answer 3-5 personalized questions
5. Generate resume
6. Verify personality-aligned language
7. Verify RAG story integration
8. Compare quality vs. Build New resume

---

## Current Issue: Access Control Bug

**Bug:** Even with Gold tier, the frontend may show the button as disabled if:
1. Resume count check is failing
2. State not refreshing after subscription tier update
3. Frontend cache issue

**Temporary Workaround:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Logout and login again
4. Check browser console for errors

**Root Cause Investigation Needed:**
- Check `/mnt/storage/shared_windows/Cvstomize/src/components/HomePage.js` line 27
- Verify API `/resume` endpoint returns correct resume count
- Check AuthContext for subscription tier caching

---

## Password Reference

For future database operations:

- **cvstomize_app password:** `CVstomize_Fresh_2025_2157`
- **postgres password:** `CVstomize_Postgres_Schema_2025_0516`
- **Database name:** `cvstomize_production`
- **Instance:** `cvstomize:us-central1:cvstomize-db`

---

## Next Steps After Granting Access

1. ✅ Grant Gold tier to test account (this document)
2. ⏭️ Fix frontend access control bug (if button still disabled)
3. ⏭️ Execute Test Categories 7-8 (Gold Standard comprehensive testing)
4. ⏭️ Document test results in TEST_RESULTS.md
5. ⏭️ Fix any bugs found during testing
6. ⏭️ Production launch decision

---

**Created:** December 4, 2025
**Purpose:** Enable Gold Standard testing for critical feature validation before production launch
