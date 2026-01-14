# ✅ Week 1 Checklist - GCP Infrastructure Setup

**Goal**: Set up production-grade GCP infrastructure
**Timeline**: 7 days
**Status**: 🟡 IN PROGRESS

---

## 📅 Day 1: Project Verification & Planning ✅ CURRENT

### Tasks
- [ ] **Verify Firebase-GCP Connection**
  - [ ] Navigate to https://console.firebase.google.com/project/cvstomize/overview
  - [ ] Check if linked to GCP project `cvstomize`
  - [ ] Verify Firebase Auth is enabled
  - [ ] Check current usage/quotas

- [ ] **Review GCP Project Setup**
  - [ ] Login to https://console.cloud.google.com/home/dashboard?project=cvstomize
  - [ ] Review enabled APIs
  - [ ] Check current billing status
  - [ ] Review IAM & permissions

- [ ] **Enable Required GCP APIs**
  - [ ] Cloud SQL Admin API
  - [ ] Cloud Storage API
  - [ ] Secret Manager API
  - [ ] Cloud Run API
  - [ ] Cloud Build API
  - [ ] Cloud Logging API
  - [ ] Cloud Monitoring API

- [ ] **Set Up Billing Alerts**
  - [ ] Navigate to Billing → Budgets & Alerts
  - [ ] Create alert at $50 (50% of Phase 1 budget)
  - [ ] Create alert at $100 (100% of Phase 1 budget)
  - [ ] Create alert at $250 (critical threshold)
  - [ ] Add email notifications

- [ ] **Create Project Documentation**
  - [x] Create ROADMAP.md
  - [x] Create WEEK1_CHECKLIST.md
  - [ ] Update README.md with new architecture
  - [ ] Create ARCHITECTURE.md (technical design doc)

### Deliverables
- ✅ Firebase connection verified
- ✅ GCP APIs enabled
- ✅ Billing alerts configured
- ✅ Documentation structure created

### Commands to Run
```bash
# Check current GCP project
gcloud config get-value project

# Set project if needed
gcloud config set project cvstomize

# Enable required APIs
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# Check enabled services
gcloud services list --enabled
```

---

## 📅 Day 2-3: Database Setup

### Tasks

#### **Day 2: Create Cloud SQL Instance**
- [ ] **Create PostgreSQL Instance**
  - [ ] Name: `cvstomize-db-prod`
  - [ ] Database version: PostgreSQL 15
  - [ ] Region: `us-central1`
  - [ ] Zone: Any (Single zone for Phase 1)
  - [ ] Machine type: `db-n1-standard-1` (2 vCPU, 3.75GB RAM)
  - [ ] Storage: 10GB SSD (auto-increase enabled)
  - [ ] High availability: Disabled (save costs in Phase 1)

- [ ] **Configure Backups**
  - [ ] Enable automated backups
  - [ ] Backup window: 3:00 AM - 7:00 AM (PST)
  - [ ] Retention: 7 days
  - [ ] Enable point-in-time recovery
  - [ ] Enable binary logging

- [ ] **Configure Networking**
  - [ ] Enable public IP (for now, private later)
  - [ ] Add authorized network: Your IP
  - [ ] Enable Cloud SQL Proxy for secure connections
  - [ ] Note the connection name for later

- [ ] **Create Database and Users**
  - [ ] Create database: `cvstomize_prod`
  - [ ] Create user: `cvstomize_app` (for application)
  - [ ] Create user: `cvstomize_admin` (for migrations)
  - [ ] Set strong passwords (save in Secret Manager)

#### **Day 3: Deploy Database Schema**
- [ ] **Install PostgreSQL Client Locally**
  ```bash
  # macOS
  brew install postgresql

  # Linux
  sudo apt-get install postgresql-client
  ```

- [ ] **Connect to Cloud SQL**
  ```bash
  # Install Cloud SQL Proxy
  gcloud components install cloud-sql-proxy

  # Start proxy in background
  cloud-sql-proxy cvstomize:us-central1:cvstomize-db-prod &

  # Connect via psql
  psql "host=127.0.0.1 port=5432 dbname=cvstomize_prod user=cvstomize_admin"
  ```

- [ ] **Install Prisma**
  ```bash
  cd /mnt/storage/shared_windows/Cvstomize
  npm install prisma @prisma/client
  npx prisma init
  ```

- [ ] **Create Database Schema**
  - [ ] Create `prisma/schema.prisma` with all tables:
    - users
    - user_profiles
    - personality_traits
    - conversations
    - resumes
    - subscriptions
    - referrals
    - social_shares
    - viral_metrics
    - audit_logs
  - [ ] Run migrations: `npx prisma migrate dev --name init`
  - [ ] Generate Prisma Client: `npx prisma generate`

- [ ] **Test Database Connection**
  ```bash
  # Test query
  psql "host=127.0.0.1 dbname=cvstomize_prod user=cvstomize_app" -c "SELECT version();"

  # Check tables
  psql "host=127.0.0.1 dbname=cvstomize_prod user=cvstomize_app" -c "\dt"
  ```

- [ ] **Set Up Connection Pooling** (Optional for Phase 1)
  - [ ] Install PgBouncer (if needed)
  - [ ] Configure connection limits
  - [ ] Test pooled connections

### Deliverables
- ✅ Cloud SQL PostgreSQL instance running
- ✅ Database schema deployed
- ✅ Connection tested and working
- ✅ Prisma ORM configured

### Commands Reference
```bash
# Create Cloud SQL instance (via gcloud)
gcloud sql instances create cvstomize-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-1 \
  --region=us-central1 \
  --backup \
  --backup-start-time=03:00 \
  --enable-bin-log

# Create database
gcloud sql databases create cvstomize_prod --instance=cvstomize-db-prod

# Create user
gcloud sql users create cvstomize_app \
  --instance=cvstomize-db-prod \
  --password=[SECURE_PASSWORD]

# Get connection name
gcloud sql instances describe cvstomize-db-prod --format="value(connectionName)"
```

---

## 📅 Day 4: Cloud Storage Setup

### Tasks
- [ ] **Create Storage Buckets**
  - [ ] Bucket: `cvstomize-resumes-prod`
    - Location: Multi-region (US)
    - Storage class: Standard
    - Access control: Uniform
    - Public access: Prevention ON
  - [ ] Bucket: `cvstomize-uploads-prod`
    - Location: Multi-region (US)
    - Storage class: Standard
    - Access control: Uniform
    - Public access: Prevention ON

- [ ] **Configure CORS**
  ```json
  [
    {
      "origin": ["http://localhost:3000", "https://cvstomize.com"],
      "method": ["GET", "POST", "PUT", "DELETE"],
      "responseHeader": ["Content-Type"],
      "maxAgeSeconds": 3600
    }
  ]
  ```
  - [ ] Apply CORS to `cvstomize-resumes-prod`
  - [ ] Apply CORS to `cvstomize-uploads-prod`

- [ ] **Set Up Lifecycle Policies**
  ```json
  {
    "lifecycle": {
      "rule": [
        {
          "action": {"type": "Delete"},
          "condition": {"age": 365}
        }
      ]
    }
  }
  ```
  - [ ] Apply lifecycle to both buckets (GDPR compliance)

- [ ] **Configure IAM**
  - [ ] Create service account: `cvstomize-storage-sa`
  - [ ] Grant `Storage Object Admin` role to service account
  - [ ] Download service account key
  - [ ] Save key in Secret Manager

- [ ] **Test Upload/Download**
  ```bash
  # Upload test file
  echo "test" > test.txt
  gsutil cp test.txt gs://cvstomize-resumes-prod/

  # Generate signed URL
  gsutil signurl -d 1h /path/to/service-account-key.json \
    gs://cvstomize-resumes-prod/test.txt

  # Test download via signed URL
  curl -o downloaded.txt "[SIGNED_URL]"

  # Clean up
  gsutil rm gs://cvstomize-resumes-prod/test.txt
  ```

### Deliverables
- ✅ Storage buckets created and configured
- ✅ CORS policies applied
- ✅ Lifecycle policies set (1-year retention)
- ✅ Signed URLs working

### Commands Reference
```bash
# Create buckets
gsutil mb -c STANDARD -l US gs://cvstomize-resumes-prod
gsutil mb -c STANDARD -l US gs://cvstomize-uploads-prod

# Apply CORS
gsutil cors set cors-config.json gs://cvstomize-resumes-prod
gsutil cors set cors-config.json gs://cvstomize-uploads-prod

# Apply lifecycle
gsutil lifecycle set lifecycle-config.json gs://cvstomize-resumes-prod
gsutil lifecycle set lifecycle-config.json gs://cvstomize-uploads-prod

# Create service account
gcloud iam service-accounts create cvstomize-storage-sa \
  --display-name="CVstomize Storage Service Account"

# Grant permissions
gsutil iam ch serviceAccount:cvstomize-storage-sa@cvstomize.iam.gserviceaccount.com:objectAdmin \
  gs://cvstomize-resumes-prod

# Create key
gcloud iam service-accounts keys create storage-sa-key.json \
  --iam-account=cvstomize-storage-sa@cvstomize.iam.gserviceaccount.com
```

---

## 📅 Day 5: Secret Manager & Security

### Tasks
- [ ] **Enable Secret Manager API**
  ```bash
  gcloud services enable secretmanager.googleapis.com
  ```

- [ ] **Store Secrets**
  - [ ] **Gemini API Key**
    ```bash
    echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
    ```
  - [ ] **Database Password (App User)**
    ```bash
    echo -n "DB_PASSWORD" | gcloud secrets create db-app-password --data-file=-
    ```
  - [ ] **Database Connection String**
    ```bash
    echo -n "postgresql://user:pass@host/db" | gcloud secrets create db-connection-string --data-file=-
    ```
  - [ ] **JWT Signing Key**
    ```bash
    openssl rand -base64 64 | gcloud secrets create jwt-signing-key --data-file=-
    ```
  - [ ] **Storage Service Account Key**
    ```bash
    cat storage-sa-key.json | gcloud secrets create storage-sa-key --data-file=-
    ```

- [ ] **Configure IAM Access to Secrets**
  - [ ] Create service account: `cvstomize-app-sa`
  - [ ] Grant `Secret Manager Secret Accessor` role
  - [ ] Test secret access

- [ ] **Set Up Service Accounts**
  - [ ] `cvstomize-app-sa` - For Cloud Run application
  - [ ] `cvstomize-storage-sa` - For Cloud Storage access
  - [ ] `cvstomize-db-sa` - For Cloud SQL access (optional)

- [ ] **Test Secret Access**
  ```bash
  # Test reading a secret
  gcloud secrets versions access latest --secret="gemini-api-key"
  ```

### Deliverables
- ✅ All secrets stored in Secret Manager
- ✅ IAM permissions configured
- ✅ Service accounts created
- ✅ Secret access tested

### Commands Reference
```bash
# List secrets
gcloud secrets list

# Create secret
echo -n "secret_value" | gcloud secrets create secret-name --data-file=-

# Add secret version
echo -n "new_value" | gcloud secrets versions add secret-name --data-file=-

# Access secret
gcloud secrets versions access latest --secret="secret-name"

# Grant access to service account
gcloud secrets add-iam-policy-binding secret-name \
  --member="serviceAccount:cvstomize-app-sa@cvstomize.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 📅 Day 6-7: Local Development Environment

### Tasks

#### **Day 6: Docker Setup**
- [ ] **Create Docker Compose Configuration**
  - [ ] Create `docker-compose.dev.yml`
  - [ ] Services:
    - PostgreSQL (local database)
    - Redis (optional, for caching)
    - App (Node.js API)

- [ ] **Create Dockerfile**
  ```dockerfile
  FROM node:20-alpine

  WORKDIR /app

  # Install dependencies
  COPY package*.json ./
  RUN npm ci

  # Copy app source
  COPY . .

  # Generate Prisma client
  RUN npx prisma generate

  # Expose port
  EXPOSE 3001

  # Start app
  CMD ["npm", "run", "dev"]
  ```

- [ ] **Create `.dockerignore`**
  ```
  node_modules
  npm-debug.log
  .git
  .env
  .env.local
  .DS_Store
  ```

- [ ] **Test Docker Build**
  ```bash
  docker-compose -f docker-compose.dev.yml build
  docker-compose -f docker-compose.dev.yml up
  ```

#### **Day 7: Environment Configuration**
- [ ] **Create `.env.example`**
  ```env
  # Database
  DATABASE_URL="postgresql://user:password@localhost:5432/cvstomize_dev"

  # Firebase
  FIREBASE_PROJECT_ID="cvstomize"
  FIREBASE_CLIENT_EMAIL=""
  FIREBASE_PRIVATE_KEY=""

  # Google Cloud
  GCP_PROJECT_ID="cvstomize"
  GCP_STORAGE_BUCKET_RESUMES="cvstomize-resumes-prod"
  GCP_STORAGE_BUCKET_UPLOADS="cvstomize-uploads-prod"

  # Gemini API
  GEMINI_API_KEY="your_gemini_api_key_here"

  # JWT
  JWT_SECRET="your_jwt_secret_here"
  JWT_EXPIRES_IN="1h"

  # App Config
  NODE_ENV="development"
  PORT=3001
  FRONTEND_URL="http://localhost:3000"

  # Rate Limiting
  RATE_LIMIT_MAX_REQUESTS=100
  RATE_LIMIT_WINDOW_MS=60000
  ```

- [ ] **Create `.env.local`** (copy from .env.example)
- [ ] **Add to `.gitignore`**
  ```
  .env.local
  .env.production
  ```

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Run Database Migrations Locally**
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```

- [ ] **Test Local API**
  ```bash
  npm run dev
  # Test at http://localhost:3001/health
  ```

- [ ] **Document Setup Process**
  - [ ] Update README.md with setup instructions
  - [ ] Create DEVELOPMENT.md with dev workflow
  - [ ] Document common commands

### Deliverables
- ✅ Docker Compose working locally
- ✅ Environment configuration complete
- ✅ Local API running and tested
- ✅ Development documentation created

---

## 🎯 Week 1 Completion Checklist

### Final Verification
- [ ] GCP project configured with all required APIs
- [ ] Cloud SQL PostgreSQL instance running
- [ ] Database schema deployed via Prisma
- [ ] Cloud Storage buckets created and tested
- [ ] All secrets stored in Secret Manager
- [ ] Local development environment working
- [ ] Documentation complete
- [ ] Ready to begin Week 2 (Authentication)

### Estimated Costs (Week 1)
- Cloud SQL: ~$5-10 (partial month)
- Cloud Storage: <$1
- Secret Manager: Free (low volume)
- **Total**: ~$5-11

### Risks & Issues
_(Document any blockers or issues encountered)_

---

## 📚 Resources

### GCP Documentation
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Cloud Storage](https://cloud.google.com/storage/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

### Tools
- [Prisma Docs](https://www.prisma.io/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [gcloud CLI](https://cloud.google.com/sdk/gcloud)

### Code References
- [Existing API](api/generate-cv.js) - Current implementation
- [Current Frontend](src/) - React app structure

---

**Status**: Week 1 - Day 1 ✅ IN PROGRESS
**Last Updated**: 2025-02-02
**Next Review**: End of Day 1
