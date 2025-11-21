# 🔐 CVstomize Credentials - Secure Reference

**⚠️ IMPORTANT:** This file contains NO passwords. All credentials are stored in Google Cloud Secret Manager.

**Last Updated:** November 6, 2025

---

## 📋 How to Access Credentials

### **Command-Line Tool (Recommended)**

```bash
# List all secrets
./scripts/manage-secrets.sh list

# Get a specific secret
./scripts/manage-secrets.sh get DATABASE_URL

# Export all secrets for local development
./scripts/manage-secrets.sh export .env.local

# Rotate database password
./scripts/manage-secrets.sh rotate-db

# Generate a new secure password
./scripts/manage-secrets.sh generate

# Create secrets for new environment
./scripts/manage-secrets.sh init staging
```

### **Direct gcloud Commands**

```bash
# Get a secret value
gcloud secrets versions access latest --secret=DATABASE_URL --project=cvstomize

# List all secrets
gcloud secrets list --project=cvstomize

# Add new secret version
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

### **Web Console**

Access via: https://console.cloud.google.com/security/secret-manager?project=cvstomize

---

## 🗄️ Secret Inventory

### **Production Secrets**

| Secret Name | Description | How to Access |
|------------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string with password | `./scripts/manage-secrets.sh get DATABASE_URL` |
| `JWT_SECRET` | JWT signing secret for authentication | `./scripts/manage-secrets.sh get JWT_SECRET` |
| `GCS_BUCKET_NAME` | Cloud Storage bucket name | `./scripts/manage-secrets.sh get GCS_BUCKET_NAME` |
| `SENTRY_DSN` | Sentry error tracking DSN (when added) | `./scripts/manage-secrets.sh get SENTRY_DSN` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `./scripts/manage-secrets.sh get FIREBASE_PROJECT_ID` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `./scripts/manage-secrets.sh get FIREBASE_CLIENT_EMAIL` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | `./scripts/manage-secrets.sh get FIREBASE_PRIVATE_KEY` |

### **Staging Secrets** (to be created)

| Secret Name | Description | Create Command |
|------------|-------------|----------------|
| `DATABASE_URL_staging` | Staging database URL | `./scripts/manage-secrets.sh init staging` |
| `JWT_SECRET_staging` | Staging JWT secret | Auto-created with init |
| `GCS_BUCKET_NAME_staging` | Staging bucket | Auto-created with init |

### **Development Secrets** (to be created)

| Secret Name | Description | Create Command |
|------------|-------------|----------------|
| `DATABASE_URL_dev` | Dev database URL | `./scripts/manage-secrets.sh init dev` |
| `JWT_SECRET_dev` | Dev JWT secret | Auto-created with init |
| `GCS_BUCKET_NAME_dev` | Dev bucket | Auto-created with init |

---

## 🔑 Infrastructure Credentials

### **Cloud SQL Database**

**Instance Name:** `cvstomize-db`
**Version:** PostgreSQL 15
**Region:** us-central1
**Database:** `cvstomize_production`

**Users:**
- `postgres` (admin) - Password in Secret Manager: `POSTGRES_PASSWORD` (to be created)
- `cvstomize_app` (application) - Password in Secret Manager: `DATABASE_URL` (embedded in connection string)

**Connection:**
```bash
# Get connection string from Secret Manager
./scripts/manage-secrets.sh get DATABASE_URL

# Connect via psql (requires Cloud SQL Proxy)
cloud_sql_proxy -instances=cvstomize:us-central1:cvstomize-db=tcp:5432 &
psql $(./scripts/manage-secrets.sh get DATABASE_URL)
```

### **Cloud Storage**

**Buckets:**
- `cvstomize-resumes-prod` - Production resumes
- `cvstomize-uploads-prod` - Production uploads
- `cvstomize-resumes-staging` - Staging resumes (to be created)
- `cvstomize-resumes-dev` - Dev resumes (to be created)

**Service Account:** `cvstomize-deployer@cvstomize.iam.gserviceaccount.com`

### **Vertex AI**

**Project:** cvstomize
**Models:** Gemini 1.5 Flash, Gemini 1.5 Pro
**Authentication:** ADC (Application Default Credentials) via service account

---

## 🚀 Setting Up Local Development

### **Step 1: Export Secrets**

```bash
cd /mnt/storage/shared_windows/Cvstomize
./scripts/manage-secrets.sh export .env.local
```

This creates `.env.local` with all secrets from Secret Manager.

### **Step 2: Add to .gitignore**

```bash
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### **Step 3: Use in Development**

```javascript
// api/index.js
require('dotenv').config({ path: '.env.local' });

console.log('Database:', process.env.DATABASE_URL.substring(0, 30) + '...');
```

---

## 🔄 Rotating Credentials

### **Database Password Rotation**

```bash
# Automated rotation (recommended)
./scripts/manage-secrets.sh rotate-db

# This will:
# 1. Generate new secure password
# 2. Update Cloud SQL user
# 3. Update DATABASE_URL secret
# 4. Log the action
```

**After rotation:**
1. Redeploy Cloud Run: `gcloud run services update cvstomize-api --region us-central1`
2. Test database connectivity
3. Monitor logs for errors

### **JWT Secret Rotation**

```bash
# Generate new secret
NEW_JWT=$(./scripts/manage-secrets.sh generate)

# Update Secret Manager
./scripts/manage-secrets.sh set JWT_SECRET "$NEW_JWT"

# Redeploy services
gcloud run services update cvstomize-api --region us-central1
```

**Warning:** Rotating JWT_SECRET will invalidate all existing user sessions!

### **Rotation Schedule**

| Secret | Rotation Frequency | Last Rotated | Next Rotation |
|--------|-------------------|--------------|---------------|
| Database Password | Every 90 days | 2025-11-06 | 2026-02-04 |
| JWT Secret | Every 180 days | 2025-11-06 | 2026-05-05 |
| API Keys | When compromised | N/A | As needed |

---

## 🛡️ Security Best Practices

### ✅ DO:

- **Use Secret Manager CLI** for all credential access
- **Rotate passwords** every 90 days (automated script provided)
- **Use separate secrets** for dev/staging/production
- **Enable audit logging** (already enabled for Secret Manager)
- **Limit IAM access** to secret-manager.secretAccessor role
- **Monitor access logs** via Cloud Console

### ❌ DON'T:

- **Never commit** `.env.local` or `.env.*.local` files
- **Never share** credentials via email, Slack, or messages
- **Never hardcode** credentials in source code
- **Never reuse** production credentials in dev/staging
- **Never store** credentials in documentation files

---

## 🔍 Audit & Monitoring

### **View Secret Access Logs**

```bash
# View recent secret accesses
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" \
  --limit 50 \
  --format json \
  --project=cvstomize
```

### **Alert on Suspicious Access**

Set up alerts in Cloud Monitoring:
```bash
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_EMAIL \
  --display-name="Suspicious Secret Access" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=60s
```

---

## 📞 Emergency Access

### **If You Lose Access to Secret Manager:**

1. **Authenticate with project owner:**
   ```bash
   gcloud auth login ashley.caban.c@gmail.com
   ```

2. **Grant yourself access:**
   ```bash
   gcloud projects add-iam-policy-binding cvstomize \
     --member="user:YOUR_EMAIL" \
     --role="roles/secretmanager.admin"
   ```

3. **Reset credentials if needed:**
   ```bash
   ./scripts/manage-secrets.sh rotate-db
   ```

### **If Database Password is Lost:**

```bash
# Reset via gcloud (requires Cloud SQL Admin role)
NEW_PASSWORD=$(openssl rand -base64 32)

gcloud sql users set-password cvstomize_app \
  --instance=cvstomize-db \
  --password="$NEW_PASSWORD"

# Update Secret Manager
./scripts/manage-secrets.sh set DATABASE_URL "postgresql://cvstomize_app:$NEW_PASSWORD@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db"
```

---

## 📚 Related Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - How to deploy with secrets
- [PRODUCTION_IMPROVEMENTS.md](PRODUCTION_IMPROVEMENTS.md) - Security roadmap
- [scripts/manage-secrets.sh](scripts/manage-secrets.sh) - Secret management CLI

---

## 🔗 Quick Links

- **Secret Manager Console:** https://console.cloud.google.com/security/secret-manager?project=cvstomize
- **Cloud SQL Console:** https://console.cloud.google.com/sql/instances?project=cvstomize
- **IAM Console:** https://console.cloud.google.com/iam-admin/iam?project=cvstomize
- **Audit Logs:** https://console.cloud.google.com/logs/query?project=cvstomize

---

**Security Contact:** ashley.caban.c@gmail.com
**Last Security Audit:** 2025-11-06
**Next Audit:** 2025-12-06 (Monthly)
