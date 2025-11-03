# 🔐 CVstomize Credentials Reference

**⚠️ IMPORTANT: This file contains sensitive information. Do NOT commit to Git!**

**Last Updated**: 2025-02-02
**Project**: cvstomize

---

## 📋 **Quick Access Summary**

All production credentials are stored in **Google Cloud Secret Manager** for security.

**Access secrets via:**
- Console: https://console.cloud.google.com/security/secret-manager?project=cvstomize
- CLI: `gcloud secrets versions access latest --secret=SECRET_NAME --project=cvstomize`

---

## 🗄️ **Database Credentials**

### **Cloud SQL Instance**
- **Instance Name**: `cvstomize-db`
- **Database Version**: PostgreSQL 15
- **Instance Type**: db-f1-micro (0.6GB RAM)
- **Region**: us-central1-a
- **Public IP**: `34.67.70.34`
- **Port**: `5432`

### **Database Name**
- **Production Database**: `cvstomize_production`

### **Database Users**

#### **Postgres Root User (Admin only)**
- **Username**: `postgres`
- **Password**: `TEMP_PASSWORD_123!`
- **Use Case**: Database administration, schema changes, backups
- **⚠️ WARNING**: Do NOT use in application code!

#### **Application User (Production)**
- **Username**: `cvstomize_app`
- **Password**: `CVst0mize_App_2025!`
- **Use Case**: Application connections, API queries
- **Permissions**: SELECT, INSERT, UPDATE, DELETE on all tables
- **Stored in Secret Manager**: `cvstomize-db-password`

### **Connection Strings**

#### **Application Connection String**
```
postgresql://cvstomize_app:CVst0mize_App_2025!@34.67.70.34:5432/cvstomize_production
```
**Stored in Secret Manager**: `cvstomize-db-connection-string`

#### **Admin Connection String** (for psql)
```
postgresql://postgres:TEMP_PASSWORD_123!@34.67.70.34:5432/cvstomize_production
```

#### **Connection via Cloud SQL Proxy** (recommended for local dev)
```bash
# Start proxy
cloud_sql_proxy -instances=cvstomize:us-central1:cvstomize-db=tcp:5432

# Then connect locally
postgresql://cvstomize_app:CVst0mize_App_2025!@localhost:5432/cvstomize_production
```

---

## 🔑 **Secret Manager Secrets**

| Secret Name | Description | Access Command |
|------------|-------------|----------------|
| `cvstomize-db-password` | App user password | `gcloud secrets versions access latest --secret=cvstomize-db-password --project=cvstomize` |
| `cvstomize-db-connection-string` | Full PostgreSQL connection string | `gcloud secrets versions access latest --secret=cvstomize-db-connection-string --project=cvstomize` |
| `cvstomize-service-account-key` | Service account key (JSON) for Cloud Storage access | `gcloud secrets versions access latest --secret=cvstomize-service-account-key --project=cvstomize` |

### **Retrieve Secrets via CLI**

```bash
# Get database password
gcloud secrets versions access latest \
  --secret=cvstomize-db-password \
  --project=cvstomize

# Get connection string
gcloud secrets versions access latest \
  --secret=cvstomize-db-connection-string \
  --project=cvstomize
```

### **Use Secrets in Node.js Backend**

```javascript
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/cvstomize/secrets/${secretName}/versions/latest`,
  });
  return version.payload.data.toString('utf8');
}

// Usage
const dbPassword = await getSecret('cvstomize-db-password');
const dbConnectionString = await getSecret('cvstomize-db-connection-string');
```

---

## 🔥 **Firebase Credentials**

### **Firebase Project**
- **Project ID**: `cvstomize`
- **Project Number**: `351889420459`
- **Console**: https://console.firebase.google.com/project/cvstomize

### **Authentication**
- **Providers Enabled**: (to be configured in Week 2)
  - Google OAuth 2.0
  - Email/Password

### **Firebase Admin SDK** (future)
- Service account key will be stored in Secret Manager as: `firebase-admin-key`
- Download from: https://console.firebase.google.com/project/cvstomize/settings/serviceaccounts/adminsdk

---

## 🤖 **API Keys** (future)

### **Gemini API**
- **Key Location**: To be stored in Secret Manager as `gemini-api-key`
- **Usage**:
  - Gemini 1.5 Flash for conversations
  - Gemini 1.5 Pro for resume generation

### **Gemini API Access**
```bash
# Will be created in Week 3
gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --project=cvstomize
```

---

## ☁️ **Cloud Storage** ✅ CONFIGURED

### **Buckets**
- **cvstomize-resumes-prod**
  - Location: us-central1
  - Storage Class: Standard
  - CORS: Enabled (localhost:3000, *.vercel.app)
  - Lifecycle: Auto-delete after 365 days
  - Access: gs://cvstomize-resumes-prod/

- **cvstomize-uploads-prod**
  - Location: us-central1
  - Storage Class: Standard
  - CORS: Enabled (localhost:3000, *.vercel.app)
  - Lifecycle: Auto-delete after 30 days
  - Access: gs://cvstomize-uploads-prod/

### **Service Account**
- **Email**: cvstomize-app@cvstomize.iam.gserviceaccount.com
- **Display Name**: CVstomize Application Service Account
- **Permissions**: Storage Object Admin (read/write/delete on both buckets)
- **Key Location**: Secret Manager (cvstomize-service-account-key)

### **Access from Node.js Backend**
```javascript
const {Storage} = require('@google-cloud/storage');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Option 1: Use service account key from Secret Manager
const secretClient = new SecretManagerServiceClient();
async function getServiceAccountKey() {
  const [version] = await secretClient.accessSecretVersion({
    name: 'projects/cvstomize/secrets/cvstomize-service-account-key/versions/latest',
  });
  return JSON.parse(version.payload.data.toString('utf8'));
}

const credentials = await getServiceAccountKey();
const storage = new Storage({
  projectId: 'cvstomize',
  credentials: credentials
});

// Option 2: Use default credentials (when running on Cloud Run)
const storage = new Storage({
  projectId: 'cvstomize'
});

// Upload file
await storage.bucket('cvstomize-resumes-prod').upload('local-file.pdf', {
  destination: 'resumes/user123/resume.pdf',
  metadata: {
    contentType: 'application/pdf'
  }
});

// Generate signed URL (1 hour expiration)
const [url] = await storage
  .bucket('cvstomize-resumes-prod')
  .file('resumes/user123/resume.pdf')
  .getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
```

---

## 🔐 **GCP Project Access**

### **Project Details**
- **Project ID**: `cvstomize`
- **Project Number**: `351889420459`
- **Billing Account**: `019DB3-2FD09E-256E00`

### **Owners**
- ashley.caban.c@gmail.com (Primary)
- wyofalcon@gmail.com (Co-owner, Billing admin)

### **Console URLs**
- **Project Dashboard**: https://console.cloud.google.com/home/dashboard?project=cvstomize
- **Cloud SQL**: https://console.cloud.google.com/sql/instances?project=cvstomize
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=cvstomize
- **Billing**: https://console.cloud.google.com/billing/019DB3-2FD09E-256E00
- **Firebase**: https://console.firebase.google.com/project/cvstomize

---

## 📝 **Environment Variables for Local Development**

Create a `.env.local` file (NOT committed to Git) with:

```bash
# Database
DATABASE_URL=postgresql://cvstomize_app:CVst0mize_App_2025!@localhost:5432/cvstomize_production
DB_HOST=34.67.70.34
DB_PORT=5432
DB_NAME=cvstomize_production
DB_USER=cvstomize_app
DB_PASSWORD=CVst0mize_App_2025!

# GCP Project
GCP_PROJECT_ID=cvstomize
GCP_PROJECT_NUMBER=351889420459

# Cloud Storage
STORAGE_BUCKET_RESUMES=cvstomize-resumes-prod
STORAGE_BUCKET_UPLOADS=cvstomize-uploads-prod
GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account-key.json>

# Firebase (to be added in Week 2)
FIREBASE_PROJECT_ID=cvstomize
FIREBASE_API_KEY=<to-be-added>
FIREBASE_AUTH_DOMAIN=cvstomize.firebaseapp.com

# Gemini API (to be added in Week 3)
GEMINI_API_KEY=<to-be-added>

# Environment
NODE_ENV=development
PORT=3001
```

---

## 🔒 **Security Best Practices**

### ✅ **DO:**
- Use Secret Manager for all production credentials
- Use Cloud SQL Proxy for local development connections
- Rotate passwords every 90 days
- Use service accounts with minimal permissions for Cloud Run
- Enable audit logging for all credential access

### ❌ **DON'T:**
- Commit `.env` files to Git
- Share credentials via email or Slack
- Use root database user in application code
- Hardcode credentials in source code
- Use the same credentials for dev and prod

---

## 🔄 **Credential Rotation Plan**

### **90-Day Rotation Schedule**

**Database Passwords:**
1. Create new password
2. Update Secret Manager
3. Update running Cloud Run services
4. Verify connections working
5. Revoke old password

**API Keys:**
1. Generate new API key
2. Update Secret Manager
3. Deploy updated services
4. Test thoroughly
5. Revoke old key after 7 days

---

## 📞 **Emergency Access**

### **If You Forget Passwords:**

**Database Password Reset:**
```bash
# Reset postgres password
gcloud sql users set-password postgres \
  --instance=cvstomize-db \
  --password=NEW_PASSWORD \
  --project=cvstomize

# Reset app user password
gcloud sql users set-password cvstomize_app \
  --instance=cvstomize-db \
  --password=NEW_PASSWORD \
  --project=cvstomize

# Update Secret Manager
echo -n "NEW_PASSWORD" | gcloud secrets versions add cvstomize-db-password \
  --data-file=- \
  --project=cvstomize
```

**Access via GCP Console:**
- All credentials viewable in Secret Manager console
- Database accessible via Cloud Shell (no password needed with IAM auth)

---

## 📚 **Related Documentation**

- [SESSION_SUMMARY.md](SESSION_SUMMARY.md) - Session progress and status
- [ROADMAP.md](ROADMAP.md) - Full project roadmap
- [WEEK1_CHECKLIST.md](WEEK1_CHECKLIST.md) - Week 1 tasks
- [database/schema.sql](database/schema.sql) - Database schema

---

**Last Verified**: 2025-02-02
**Next Review**: 2025-03-02 (30 days)
