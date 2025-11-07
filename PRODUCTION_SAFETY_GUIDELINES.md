# Production Safety Guidelines for CVstomize

## 🚨 Lessons Learned from Nov 7, 2025 Outage

**Incident Summary:** Database password changes directly on production database caused a 30+ minute outage due to Cloud SQL password propagation delays and stale connection pooling.

---

## 1. NEVER Modify Production Directly

### ❌ DON'T:
- Change database passwords on production database
- Run `ALTER TABLE` or schema changes on production
- Test experimental fixes on production
- Reset passwords to "troubleshoot" connection issues
- Deploy unverified code to production

### ✅ DO:
- Use staging environment for ALL testing
- Test password changes on staging first
- Verify database migrations on staging
- Run full test suite before production deploy
- Document all production changes in advance

---

## 2. Staging Environment (MANDATORY)

### Setup Staging Now:
```bash
# Run from Windows PowerShell in Cloud SDK directory
bash /mnt/storage/shared_windows/Cvstomize/setup-staging-environment.sh
```

### Staging Workflow:
1. **Develop** on local machine
2. **Deploy** to staging environment
3. **Test** thoroughly on staging
4. **Verify** all functionality works
5. **Document** changes made
6. **Deploy** to production only after staging success

### Staging Benefits:
- Catches bugs before production
- Tests database migrations safely
- Validates API changes
- No production customer impact
- Can break/fix without pressure

---

## 3. Database Migration Best Practices

### Always Follow This Process:
```bash
# 1. Create migration file locally
cd /mnt/storage/shared_windows/Cvstomize/api
npx prisma migrate dev --name add_messages_column

# 2. Test migration on LOCAL database first
DATABASE_URL="postgresql://localhost:5432/cvstomize_local" npx prisma migrate deploy

# 3. Deploy to STAGING database
DATABASE_URL="$STAGING_DATABASE_URL" npx prisma migrate deploy

# 4. Verify staging works completely

# 5. ONLY THEN deploy to production database
DATABASE_URL="$PRODUCTION_DATABASE_URL" npx prisma migrate deploy

# 6. Monitor production logs for 10 minutes after deployment
```

### Migration Checklist:
- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Backup created before production migration
- [ ] Rollback plan documented
- [ ] Monitoring dashboard open
- [ ] Team notified of deployment window

---

## 4. Password Management

### NEVER:
- Change production database passwords unless absolutely necessary
- Reset passwords to troubleshoot (use staging instead)
- Store passwords in code or git
- Share passwords via chat or email

### Password Change Protocol (If Required):
```bash
# 1. Schedule maintenance window
# 2. Notify all stakeholders
# 3. Create NEW secret version FIRST (don't update existing)
echo -n 'NEW_PASSWORD_HERE' | gcloud secrets versions add DATABASE_URL --data-file=-

# 4. Update Cloud Run to use new secret version
gcloud run services update cvstomize-api \
  --region us-central1 \
  --update-secrets DATABASE_URL=DATABASE_URL:latest

# 5. Wait for new revision to deploy (verify healthy)
# 6. ONLY THEN change database password to match
gcloud sql users set-password cvstomize_app \
  --instance=cvstomize-db \
  --password='NEW_PASSWORD_HERE'

# 7. Wait 15 minutes for propagation
# 8. Monitor logs for authentication errors
```

### Password Propagation Times:
- **Cloud SQL:** 5-15 minutes
- **Cloud Run:** Immediate on new revisions
- **Existing containers:** Must be restarted

---

## 5. Deployment Safety Checks

### Pre-Deployment Checklist:
```bash
# 1. Run all tests
npm test

# 2. Check for uncommitted changes
git status

# 3. Verify you're on correct branch
git branch --show-current

# 4. Confirm staging is working
curl https://cvstomize-api-staging-<hash>.run.app/health

# 5. Create git tag for rollback point
git tag -a v$(date +%Y%m%d-%H%M) -m "Pre-production deployment"

# 6. Deploy
gcloud run deploy cvstomize-api --source . --region us-central1 [options]

# 7. Monitor for 10 minutes
watch -n 5 'curl -s https://cvstomize-api-351889420459.us-central1.run.app/health'
```

### Rollback Procedure:
```bash
# If deployment fails, immediately rollback to previous revision
gcloud run revisions list --service cvstomize-api --region us-central1 --limit 5

# Route traffic to last known good revision
gcloud run services update-traffic cvstomize-api \
  --region us-central1 \
  --to-revisions=cvstomize-api-00XXX-yyy=100
```

---

## 6. Monitoring & Alerts

### Set Up Monitoring:
```bash
# Create uptime check
gcloud monitoring uptime create https://cvstomize-api-351889420459.us-central1.run.app/health \
  --display-name="CVstomize API Health" \
  --check-interval=60s

# Create alert for 503 errors
gcloud alpha monitoring policies create \
  --notification-channels=<your-email> \
  --display-name="CVstomize API 503 Errors" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

### What to Monitor:
- API health endpoint (every 60s)
- Error rate (>5% triggers alert)
- Response time (>2s triggers alert)
- Database connection errors
- Container restart frequency

---

## 7. Secret Management

### Secret Versioning:
```bash
# Always create NEW versions, don't overwrite
gcloud secrets versions add SECRET_NAME --data-file=-

# Never delete old versions immediately (keep 3 versions minimum)
gcloud secrets versions list DATABASE_URL

# Pin to specific version for stability
gcloud run services update cvstomize-api \
  --update-secrets DATABASE_URL=DATABASE_URL:3  # Pin to version 3
```

### Secret Rotation Schedule:
- Database passwords: Every 90 days
- JWT secrets: Every 180 days
- API keys: Per service provider recommendation
- Always rotate on staging first

---

## 8. Database Connection Pooling

### Prisma Connection Management:
```javascript
// api/prisma/client.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pool settings
  connectionLimit: 10,
  // Timeout settings
  connectTimeout: 10000,
  pool: {
    timeout: 10000,
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Connection Pool Best Practices:
- Set `connectionLimit` to match Cloud SQL max_connections
- Configure timeouts to fail fast (10s max)
- Implement connection retry logic
- Log connection errors with context
- Monitor connection pool exhaustion

---

## 9. Testing Requirements

### Before ANY Production Deployment:
```bash
# 1. Unit tests (must pass 100%)
npm test

# 2. Integration tests
npm run test:integration

# 3. E2E tests on staging
npm run test:e2e --env=staging

# 4. Manual smoke testing
- Register new user
- Login
- Upload file
- Generate resume
- Download PDF
```

### Test Coverage Minimums:
- Critical paths: 100% coverage
- API endpoints: 90% coverage
- Business logic: 85% coverage
- Overall: 80% coverage

---

## 10. Incident Response Protocol

### If Production Goes Down:

**Step 1: STOP making changes (2 minutes)**
- Don't try to "fix" it immediately
- Stop all deployments
- Assess the situation

**Step 2: Rollback (5 minutes)**
```bash
# Find last working revision
gcloud run revisions list --service cvstomize-api --region us-central1

# Rollback traffic
gcloud run services update-traffic cvstomize-api \
  --region us-central1 \
  --to-revisions=<LAST_GOOD_REVISION>=100
```

**Step 3: Investigate (10 minutes)**
```bash
# Check logs
gcloud run services logs read cvstomize-api --region us-central1 --limit 100

# Check database
# Check secrets
# Check recent changes
```

**Step 4: Fix in Staging**
- Reproduce issue on staging
- Develop fix on staging
- Verify fix works on staging
- Document root cause

**Step 5: Deploy Fix to Production**
- Only after staging verification
- Monitor continuously
- Document incident

---

## 11. Emergency Contacts & Procedures

### Maintenance Mode:
```bash
# If you need to take site down for maintenance:
# 1. Deploy maintenance page
gcloud run deploy cvstomize-api-maintenance \
  --image=gcr.io/cvstomize/maintenance-page:latest \
  --region us-central1

# 2. Route all traffic to maintenance page
gcloud run services update-traffic cvstomize-api \
  --to-revisions=cvstomize-api-maintenance=100

# 3. Perform maintenance on real service
# 4. Route traffic back when done
```

---

## 12. Cost vs. Safety Tradeoffs

### Staging Environment Cost:
- Database: $7/month (db-f1-micro)
- Cloud Run: $5/month (minimal traffic)
- **Total: ~$12/month**

### Production Outage Cost:
- Revenue loss: $X per hour
- Customer trust: Immeasurable
- Engineering time: 2+ hours @ $Y/hour
- **Total: Much higher than $12/month**

**Conclusion: Staging environment pays for itself immediately**

---

## Summary: Golden Rules

1. ✅ **NEVER touch production database directly**
2. ✅ **ALWAYS test on staging first**
3. ✅ **ALWAYS have a rollback plan**
4. ✅ **ALWAYS monitor after deployments**
5. ✅ **NEVER change passwords without planning**
6. ✅ **ALWAYS version secrets properly**
7. ✅ **ALWAYS run full test suite**
8. ✅ **NEVER deploy on Fridays** (unless critical)
9. ✅ **ALWAYS document changes**
10. ✅ **NEVER rush production fixes**

---

## Quick Reference Commands

```bash
# Check production health
curl https://cvstomize-api-351889420459.us-central1.run.app/health

# View production logs
gcloud run services logs read cvstomize-api --region us-central1 --limit 50

# List revisions
gcloud run revisions list --service cvstomize-api --region us-central1

# Rollback to previous revision
gcloud run services update-traffic cvstomize-api --to-revisions=<REVISION>=100 --region us-central1

# Check database connection
gcloud sql instances describe cvstomize-db

# List secret versions
gcloud secrets versions list DATABASE_URL
```

---

**Document Version:** 1.0
**Last Updated:** Nov 7, 2025
**Next Review:** Dec 7, 2025
