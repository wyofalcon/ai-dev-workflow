# CVstomize Backend API

Node.js + Express + Prisma backend for CVstomize v2.0

## 🏗 Architecture

- **Framework**: Express.js 5
- **Database ORM**: Prisma (PostgreSQL 15)
- **Authentication**: Firebase Admin SDK
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## 📦 Setup

### Prerequisites
- Node.js 20 LTS
- Access to GCP Cloud SQL database
- Firebase service account credentials in Secret Manager

### Installation

```bash
cd api
npm install
npx prisma generate
```

### Environment Variables

Create `.env` file (already exists with development values):

```env
NODE_ENV=development
PORT=3001
GCP_PROJECT_ID=cvstomize
DATABASE_URL="postgresql://cvstomize_app:PASSWORD@HOST:5432/cvstomize_production?schema=public"
LOG_LEVEL=info
```

## 🚀 Running the Server

### Local Development (requires Cloud SQL Proxy)

Since the Cloud SQL database is not accessible from public IPs, you need to use Cloud SQL Proxy:

#### Option 1: Cloud SQL Proxy (Recommended for local testing)

1. Download Cloud SQL Proxy:
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.13.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

2. Start Cloud SQL Proxy:
```bash
./cloud-sql-proxy cvstomize:us-central1:cvstomize-db --port 5432
```

3. In another terminal, start the API:
```bash
npm run dev
```

#### Option 2: Deploy to Cloud Run

The server is designed to run on Cloud Run where it can connect to Cloud SQL via internal networking.

### Development Mode

```bash
npm run dev        # Start with nodemon (auto-reload)
```

### Production Mode

```bash
npm start          # Start with node
```

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/register     # Create user after Firebase signup
POST /api/auth/login        # Update login timestamp
GET  /api/auth/verify       # Verify Firebase token
POST /api/auth/logout       # Log logout event
GET  /api/auth/me           # Get complete user profile
```

### Profile
```
POST /api/profile           # Create/update user profile
GET  /api/profile           # Get user profile
```

### Conversation
```
POST /api/conversation      # Start new AI conversation
GET  /api/conversation      # List all conversations
GET  /api/conversation/:id  # Get specific conversation
```

### Resume
```
POST /api/resume            # Generate new resume (checks limit)
GET  /api/resume            # List all resumes
GET  /api/resume/:id        # Get specific resume
```

## 🔒 Authentication

All API endpoints (except `/health`) require Firebase Authentication:

1. User signs up/logs in via Firebase (frontend)
2. Frontend gets Firebase ID token
3. Frontend includes token in request: `Authorization: Bearer <token>`
4. Backend verifies token with Firebase Admin SDK
5. User info attached to `req.user`

### Example Request

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

## 🗂 Project Structure

```
api/
├── index.js                 # Express server entry point
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── middleware/
│   ├── authMiddleware.js    # Firebase token verification
│   └── errorHandler.js      # Global error handling
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── profile.js           # User profile endpoints
│   ├── conversation.js      # Conversation endpoints
│   └── resume.js            # Resume generation endpoints
├── utils/
│   └── logger.js            # Winston logger configuration
├── prisma/
│   └── schema.prisma        # Database schema (12 models)
└── README.md                # This file
```

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T23:45:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### Test with Valid Firebase Token

1. Sign up via frontend (http://localhost:3000)
2. Get Firebase ID token from browser console:
```javascript
firebase.auth().currentUser.getIdToken().then(token => console.log(token));
```
3. Use token in API requests

## ⚠️ Important Notes

### Database Access

The Cloud SQL database (`34.67.70.34:5432`) is **not accessible from public IPs**. You must:

1. **For local development**: Use Cloud SQL Proxy (see instructions above)
2. **For production**: Deploy to Cloud Run (has internal network access)
3. **Alternative**: Add your IP to authorized networks in Cloud SQL (not recommended for security)

### Firebase Admin SDK

The server uses Firebase Admin SDK to verify tokens. It automatically:
- Fetches service account key from Secret Manager on startup
- Initializes Firebase Admin
- Verifies tokens on each authenticated request

### Rate Limiting

- 100 requests per 15 minutes per IP
- Applied to `/api/*` routes
- Configurable in `index.js`

### Logging

- Logs to `error.log` and `combined.log`
- Console logging in development mode
- Request/response logging with duration

## 🔄 Next Steps

1. **Set up Cloud SQL Proxy** for local development testing
2. **Test authentication flow** with Firebase tokens
3. **Implement Gemini API integration** for resume generation
4. **Add unit tests** with Jest
5. **Deploy to Cloud Run** for production testing

## 📝 Session Notes

**Session 2 (2025-11-02)**:
- ✅ Express server created with all middleware
- ✅ Firebase Admin auth middleware implemented
- ✅ Auth routes created (register, login, verify, me, logout)
- ✅ Profile, conversation, resume routes created
- ✅ Error handling and logging implemented
- ✅ Dependencies installed (356 packages, 0 vulnerabilities)
- ✅ Prisma client generated successfully
- ⏳ Database connection requires Cloud SQL Proxy (not tested yet)
- ⏳ Authentication flow testing pending (requires Firebase tokens)

**Next Session Priority**: Set up Cloud SQL Proxy and test complete authentication flow.

## 🚀 Deployment to Cloud Run

### Quick Deploy

```bash
# Make script executable (first time only)
chmod +x deploy-to-cloud-run.sh

# Run deployment script
./deploy-to-cloud-run.sh
```

This automatically:
- Builds Docker container
- Pushes to Google Container Registry
- Deploys to Cloud Run with all configurations
- Connects to Cloud SQL via internal network
- Loads secrets from Secret Manager

**Time**: ~3-5 minutes

### Manual Deployment

1. **Build container**:
```bash
gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api .
```

2. **Deploy to Cloud Run**:
```bash
gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production,PORT=3001,GCP_PROJECT_ID=cvstomize \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-secrets DATABASE_URL=cvstomize-db-connection-string:latest
```

3. **Test deployment**:
```bash
SERVICE_URL=$(gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)')
curl ${SERVICE_URL}/health
```

### View Logs

```bash
# Recent logs
gcloud run logs read cvstomize-api --region us-central1 --limit 50

# Follow logs
gcloud run logs tail cvstomize-api --region us-central1
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service cvstomize-api --region us-central1

# Roll back to previous revision
gcloud run services update-traffic cvstomize-api \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1
```

### Cost

- **Free tier**: 2M requests/month, 360K GB-seconds/month
- **Min instances: 0** = scales to zero = $0 when idle
- **Expected cost**: $0-3/month for development

See [DEPLOY_NOW.md](../DEPLOY_NOW.md) for detailed deployment guide.

