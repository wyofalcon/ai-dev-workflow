# 🔥 Firebase Setup Guide - CVstomize

**Purpose:** Complete guide to Firebase configuration for development and production

---

## 🚨 SECURITY FIRST

**CRITICAL:** Firebase keys are sensitive credentials. NEVER commit them to Git!

- ✅ `.env` is now in `.gitignore`
- ✅ Use `.env.example` as a template
- ✅ Copy `.env.example` to `.env` and add your real keys
- ✅ Each developer gets their own `.env` file (not shared)

---

## 📋 Quick Start for New Developers

### Step 1: Copy Environment Template
```bash
cd /mnt/storage/shared_windows/Cvstomize
cp .env.example .env
```

### Step 2: Get Firebase Keys

**Option A: Use Existing Firebase Project (cvstomize)**
1. Ask project owner for access to Firebase Console
2. Go to: https://console.firebase.google.com/
3. Select project: **cvstomize**
4. Follow instructions below to get keys

**Option B: Create Your Own Dev Firebase Project**
1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Name it: `cvstomize-dev-yourname`
4. Follow setup wizard
5. Follow instructions below to get keys

---

## 🔑 Getting Firebase Web App Keys

These keys go in your `.env` file for the **frontend** (React app).

### Steps:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (cvstomize or your dev project)
3. Click **⚙️ (gear icon)** → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If no web app exists:
   - Click **"Add app"** → Select **Web** (</> icon)
   - Register app name: "CVstomize Web"
   - Click **"Register app"**
6. Copy the config values:

```javascript
// You'll see something like this:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

7. Add these to your `.env` file:

```bash
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxx
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🔐 Getting Firebase Admin SDK Key

This key goes in **GCP Secret Manager** (production) or local file (dev) for the **backend** (Node.js API).

### Steps:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click **⚙️ (gear icon)** → **Project Settings**
4. Click **"Service accounts"** tab
5. Click **"Generate new private key"** button
6. Click **"Generate key"** (a JSON file will download)

### For Development:
```bash
# Create secrets directory
mkdir -p /mnt/storage/shared_windows/Cvstomize/secrets

# Move the downloaded file
mv ~/Downloads/cvstomize-firebase-adminsdk-xxxxx.json \
   /mnt/storage/shared_windows/Cvstomize/secrets/firebase-admin-key.json

# Update .env to point to it
echo "GOOGLE_APPLICATION_CREDENTIALS=/mnt/storage/shared_windows/Cvstomize/secrets/firebase-admin-key.json" >> .env
```

### For Production:
```bash
# Upload to GCP Secret Manager
gcloud secrets create cvstomize-service-account-key \
  --data-file=./secrets/firebase-admin-key.json \
  --project=cvstomize

# The backend will fetch it from Secret Manager at runtime
```

---

## 🧪 Development Mode Features

CVstomize has special **dev-only** features to make testing easier:

### 1. **Unlimited Resume Generation**

**Problem:** In production, users have resume limits (e.g., 1 free resume)
**Solution:** Auto-bypass limits in development

**Setup:**
```bash
# Add to your .env file
DEV_UNLIMITED_RESUMES=true
```

**How it works:**
- When you generate a resume in dev, your user automatically gets unlimited resumes
- No need to manually upgrade your account
- Only works when `NODE_ENV=development`

---

### 2. **Dev Admin Mode**

**Problem:** Testing admin features requires manual database changes
**Solution:** Dev-only admin endpoints

**Setup:**
```bash
# Add to your .env file
DEV_ADMIN_MODE=true
```

**Available Endpoints:**

**Upgrade to Unlimited:**
```bash
POST /api/auth/dev/upgrade-unlimited
Authorization: Bearer YOUR_FIREBASE_TOKEN

# Response:
{
  "message": "Resume count reset successfully (dev mode only)",
  "user": {
    "email": "you@example.com",
    "resumesGenerated": 0,
    "resumesLimit": 999999,
    "subscriptionTier": "dev-unlimited"
  }
}
```

**Reset Resume Count:**
```bash
POST /api/auth/dev/reset-resumes
Authorization: Bearer YOUR_FIREBASE_TOKEN

# Response:
{
  "message": "Resume count reset (dev mode only)",
  "user": {
    "email": "you@example.com",
    "resumesGenerated": 0,
    "resumesLimit": 999999,
    "subscriptionTier": "dev-unlimited"
  }
}
```

**Security:**
- These endpoints return `403 Forbidden` in production
- Require `DEV_ADMIN_MODE=true` in `.env`
- Require valid Firebase authentication
- Logged with warnings for audit trail

---

## 📁 Environment File Structure

```
Cvstomize/
├── .env                    # ❌ YOUR ACTUAL KEYS (not in Git)
├── .env.example            # ✅ Template with placeholders (in Git)
├── secrets/
│   └── firebase-admin-key.json  # ❌ Firebase Admin SDK (not in Git)
└── .gitignore              # ✅ Ignores .env and secrets/ (in Git)
```

---

## 🔄 Typical Development Workflow

### First Time Setup:
```bash
# 1. Copy template
cp .env.example .env

# 2. Get Firebase keys (see instructions above)

# 3. Add keys to .env file

# 4. Enable dev features
echo "DEV_ADMIN_MODE=true" >> .env
echo "DEV_UNLIMITED_RESUMES=true" >> .env
echo "NODE_ENV=development" >> .env

# 5. Start development
npm start
```

### Daily Development:
```bash
# Just start the app - dev features are automatic
npm start

# If you hit resume limit during testing:
curl -X POST http://localhost:3001/api/auth/dev/reset-resumes \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## 🚨 What If I Accidentally Committed .env?

**DON'T PANIC.** Follow these steps:

### 1. Remove from Git Immediately
```bash
git rm --cached .env
git commit -m "Remove .env from version control"
git push
```

### 2. Remove from Git History
```bash
# This removes .env from ALL commits in history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ WARNING: This rewrites history)
git push --force --all
```

### 3. Rotate All Keys
- **Firebase Web Keys:** Regenerate in Firebase Console
- **Firebase Admin Key:** Generate new private key
- **JWT Secret:** Generate new secret
- **Database Password:** Change in Cloud SQL

### 4. Update Everyone
- Notify all team members
- Send new keys via secure channel (1Password, LastPass, etc.)
- Update production secrets in GCP Secret Manager

---

## 🏭 Production Deployment

### Checklist Before Deploy:
- [ ] `.env` is NOT in Git repository
- [ ] All secrets stored in GCP Secret Manager
- [ ] `NODE_ENV=production` set
- [ ] `DEV_ADMIN_MODE` is NOT set (or set to `false`)
- [ ] `DEV_UNLIMITED_RESUMES` is NOT set (or set to `false`)
- [ ] Strong `JWT_SECRET` (64+ characters)
- [ ] CORS restricted to production domain only
- [ ] Firebase keys rotated from dev keys

### Production Environment Variables:
```bash
# Cloud Run environment
NODE_ENV=production
DATABASE_URL=postgresql://...  # From Cloud SQL
GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-admin-key.json  # From Secret Manager

# Do NOT set these in production:
# DEV_ADMIN_MODE=false  # (don't set at all)
# DEV_UNLIMITED_RESUMES=false  # (don't set at all)
```

---

## 🧪 Testing Firebase Connection

### Test Frontend Connection:
```bash
# Start frontend
npm start

# Try to sign up/login
# Check browser console for Firebase errors
```

### Test Backend Connection:
```bash
# Start backend
cd api && npm start

# Test database connection
curl http://localhost:3001/health/detailed

# Test Firebase token verification (requires logged-in user)
curl http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## 🐛 Common Issues

### Issue: "Firebase API key not found"
**Solution:** Check that `REACT_APP_FIREBASE_API_KEY` is in `.env`

### Issue: "Firebase Admin SDK not initialized"
**Solution:** Check `GOOGLE_APPLICATION_CREDENTIALS` points to valid JSON file

### Issue: "/dev/upgrade-unlimited returns 403"
**Solution:** Set `DEV_ADMIN_MODE=true` in `.env` and restart server

### Issue: "Still hitting resume limit in dev"
**Solution:** Set `DEV_UNLIMITED_RESUMES=true` in `.env` and restart server

### Issue: "Database connection failed"
**Solution:** Check `DATABASE_URL` is correct and database is running

---

## 📞 Getting Help

**Firebase Errors:**
- Check Firebase Console → Authentication → Users (are users registering?)
- Check Firebase Console → Authentication → Sign-in methods (is Email/Password enabled?)

**Backend Errors:**
- Check logs: Backend will show Firebase initialization status on startup
- Look for: `✅ Firebase Admin SDK initialized`

**Still Stuck?**
- Check: [CREDENTIALS_REFERENCE.md](CREDENTIALS_REFERENCE.md)
- Check: [ROADMAP.md](ROADMAP.md)

---

## ✅ Checklist: "Is My Firebase Setup Correct?"

- [ ] I copied `.env.example` to `.env`
- [ ] My `.env` has all Firebase keys filled in (not placeholder values)
- [ ] My `.env` file is NOT committed to Git
- [ ] I can log in to Firebase Console and see my project
- [ ] I downloaded the Admin SDK JSON key
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` points to correct file
- [ ] I set `DEV_ADMIN_MODE=true` for development
- [ ] I set `DEV_UNLIMITED_RESUMES=true` for development
- [ ] Backend starts without Firebase errors
- [ ] Frontend can sign up/login users

---

**Last Updated:** 2025-11-06
**Maintained By:** CVstomize Dev Team

*Keep this document updated as Firebase configuration changes!*
