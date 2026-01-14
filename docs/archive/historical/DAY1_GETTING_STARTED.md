# 🚀 Day 1: Getting Started with GCP Setup

**Current Status**: Week 1, Day 1 - Project Verification & Planning
**Estimated Time**: 2-4 hours

---

## ✅ What We've Accomplished So Far

1. ✅ **Repository cloned** to local machine at `/mnt/storage/shared_windows/Cvstomize`
2. ✅ **Roadmap created** ([ROADMAP.md](ROADMAP.md)) - Full 12+ month plan
3. ✅ **Week 1 Checklist** ([WEEK1_CHECKLIST.md](WEEK1_CHECKLIST.md)) - Detailed daily tasks
4. ✅ **Project analyzed** - Understood current architecture and code

---

## 🎯 Day 1 Goals

By end of today, we will:
- ✅ Verify Firebase is connected to your GCP project
- ✅ Enable all required GCP APIs
- ✅ Set up billing alerts
- ✅ Install gcloud CLI (optional but recommended)
- ✅ Understand the project structure

---

## 📋 Step-by-Step Instructions

### **Step 1: Verify Firebase → GCP Connection** (15 mins)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/cvstomize/overview
   - Login with your Google account

2. **Check Project Settings**
   - Click the ⚙️ gear icon (top left) → Project settings
   - Look for "Project ID": Should say `cvstomize`
   - Scroll down to "Google Cloud Platform (GCP) resource location"
   - **Important**: Check if it shows a GCP project number/link

3. **Verify GCP Link**
   - In Firebase console, look for "Google Cloud Platform" section
   - It should show: "This project is linked to Google Cloud project: `cvstomize`"
   - If you see this ✅ **Firebase is connected!**
   - If you DON'T see this ⚠️ **We need to link them**

4. **Take a Screenshot**
   - Screenshot the Project Settings page
   - We'll use this to verify the connection

**✅ Checkpoint**: Can you confirm Firebase is linked to GCP project `cvstomize`?

---

### **Step 2: Access GCP Console** (10 mins)

1. **Open GCP Console**
   - Go to: https://console.cloud.google.com/home/dashboard?project=cvstomize
   - Login with the same Google account

2. **Verify Project Selection**
   - Top navigation bar should show: "cvstomize" or "CVstomize"
   - If you see a different project, click the dropdown and select `cvstomize`

3. **Check Dashboard**
   - You should see the project dashboard
   - Look for "Project Info" card showing:
     - Project name
     - Project number
     - Project ID

4. **Take a Screenshot**
   - Screenshot the dashboard
   - This confirms you have access

**✅ Checkpoint**: Can you access the GCP project dashboard?

---

### **Step 3: Check Current Setup** (10 mins)

1. **Check Enabled APIs**
   - In GCP Console, click hamburger menu (☰) → APIs & Services → Enabled APIs & services
   - Look for what's currently enabled
   - Common ones you might see:
     - Firebase APIs (if connected)
     - Compute Engine API
     - Cloud Storage API

2. **Check Billing**
   - Click hamburger menu (☰) → Billing
   - Verify billing is enabled
   - Check if you have any credits (look for "Promotions and credits")
   - Note your free trial status

3. **Take Notes**
   - List which APIs are already enabled
   - Note your current credits balance
   - Check if you have any existing resources (VMs, databases, etc.)

**✅ Checkpoint**: Do you have billing enabled and any free credits?

---

### **Step 4: Enable Required APIs** (15 mins)

We need to enable these APIs for the project:

1. **Navigate to API Library**
   - In GCP Console, go to: APIs & Services → Library
   - OR click: https://console.cloud.google.com/apis/library?project=cvstomize

2. **Enable Each API** (Search and click "Enable")
   - [ ] **Cloud SQL Admin API**
     - Search: "Cloud SQL Admin API"
     - Click it → Click "Enable" button

   - [ ] **Cloud Storage API**
     - Search: "Cloud Storage"
     - Click "Google Cloud Storage JSON API" → Enable

   - [ ] **Secret Manager API**
     - Search: "Secret Manager"
     - Click it → Enable

   - [ ] **Cloud Run API**
     - Search: "Cloud Run"
     - Click "Cloud Run Admin API" → Enable

   - [ ] **Cloud Build API**
     - Search: "Cloud Build"
     - Click it → Enable

   - [ ] **Cloud Logging API**
     - Search: "Cloud Logging"
     - Click it → Enable

   - [ ] **Cloud Monitoring API**
     - Search: "Cloud Monitoring"
     - Click it → Enable

3. **Verify All Enabled**
   - Go back to: APIs & Services → Enabled APIs & services
   - Verify all 7 APIs are now listed

**✅ Checkpoint**: All 7 APIs enabled?

---

### **Step 5: Set Up Billing Alerts** (10 mins)

This is CRITICAL to avoid unexpected charges!

1. **Navigate to Billing Budgets**
   - In GCP Console: Hamburger menu (☰) → Billing → Budgets & alerts
   - OR: https://console.cloud.google.com/billing/budgets?project=cvstomize

2. **Create Budget #1: $50 Alert**
   - Click "CREATE BUDGET"
   - Name: "Phase 1 - 50% Budget Alert"
   - Projects: Select `cvstomize`
   - Budget amount: $50
   - Set threshold alerts:
     - 50% ($25)
     - 90% ($45)
     - 100% ($50)
   - Add your email for notifications
   - Click "FINISH"

3. **Create Budget #2: $100 Alert**
   - Click "CREATE BUDGET" again
   - Name: "Phase 1 - 100% Budget Alert"
   - Projects: `cvstomize`
   - Budget amount: $100
   - Set threshold alerts:
     - 50% ($50)
     - 90% ($90)
     - 100% ($100)
   - Add your email
   - Click "FINISH"

4. **Create Budget #3: $250 Alert (Critical)**
   - Click "CREATE BUDGET" again
   - Name: "Critical Budget Alert"
   - Projects: `cvstomize`
   - Budget amount: $250
   - Set threshold alerts:
     - 50% ($125)
     - 90% ($225)
     - 100% ($250)
   - Add your email
   - Click "FINISH"

**✅ Checkpoint**: 3 budget alerts created?

---

### **Step 6: Install gcloud CLI** (Optional - 20 mins)

**Note**: This is optional but HIGHLY recommended for easier management.

#### **For macOS**:
```bash
# Install via Homebrew
brew install --cask google-cloud-sdk

# OR download installer
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init
```

#### **For Linux (Ubuntu/Debian)**:
```bash
# Add Cloud SDK repo
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Import Google Cloud public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# Install
sudo apt-get update && sudo apt-get install google-cloud-sdk

# Initialize
gcloud init
```

#### **For Windows**:
1. Download installer: https://cloud.google.com/sdk/docs/install#windows
2. Run `GoogleCloudSDKInstaller.exe`
3. Follow prompts
4. Open PowerShell and run: `gcloud init`

#### **After Installation**:
```bash
# Login
gcloud auth login

# Set project
gcloud config set project cvstomize

# Verify
gcloud config list
```

**✅ Checkpoint**: Can you run `gcloud config list` successfully?

---

### **Step 7: Review Current Project Structure** (10 mins)

Let's understand what we have:

1. **Current Architecture**:
   ```
   Cvstomize/
   ├── api/              # Backend (serverless function)
   │   └── generate-cv.js   # Main API endpoint
   ├── src/              # React frontend
   │   ├── components/   # UI components
   │   ├── hooks/        # React hooks
   │   └── services/     # API client
   ├── public/           # Static assets
   ├── package.json      # Dependencies
   └── vercel.json       # Vercel config (will replace with Cloud Run)
   ```

2. **What We're Building**:
   - Move from Vercel → Google Cloud Run
   - Add PostgreSQL database (Cloud SQL)
   - Add Cloud Storage for PDFs
   - Add Firebase Auth for users
   - Add conversational AI profile builder

3. **Review the Roadmap**:
   - Open [ROADMAP.md](ROADMAP.md)
   - Read through Phase 1 (Months 1-3)
   - Understand the viral growth strategy

**✅ Checkpoint**: Do you understand the current vs. future architecture?

---

## 🎉 Day 1 Complete!

### What You've Accomplished:
- ✅ Verified Firebase → GCP connection
- ✅ Accessed GCP Console
- ✅ Enabled 7 required APIs
- ✅ Set up 3 budget alerts (critical for cost control!)
- ✅ (Optional) Installed gcloud CLI
- ✅ Reviewed project structure and roadmap

### Next Steps (Day 2-3):
Tomorrow we'll create:
1. Cloud SQL PostgreSQL database
2. Cloud Storage buckets
3. Secret Manager secrets
4. Database schema with Prisma

---

## 📊 Current Status Summary

| Item | Status |
|------|--------|
| Firebase Connected | ✅ / ⏳ / ❌ |
| GCP Console Access | ✅ / ⏳ / ❌ |
| APIs Enabled (7) | ✅ / ⏳ / ❌ |
| Billing Alerts Set | ✅ / ⏳ / ❌ |
| gcloud CLI Installed | ✅ / ⏳ / ❌ (optional) |
| Roadmap Reviewed | ✅ / ⏳ / ❌ |

**Overall Day 1 Progress**: __%

---

## 🆘 Troubleshooting

### **Issue: Can't access GCP project**
- **Solution**: Make sure you're logged in with the correct Google account
- Check if you have "Owner" or "Editor" role in the project

### **Issue: Can't enable APIs**
- **Solution**: Verify billing is enabled on the project
- Check if you have sufficient permissions (need Editor or Owner role)

### **Issue: Don't see Firebase link to GCP**
- **Solution**:
  1. In Firebase console, go to Project Settings
  2. Look for "Service accounts" tab
  3. It should show the GCP project connection
  4. If not, we may need to create a new Firebase project or link manually

### **Issue: Budget alerts not working**
- **Solution**:
  1. Verify billing account is active
  2. Check email spam folder for budget alert confirmation
  3. Make sure you added your email address correctly

---

## 📞 Need Help?

If you get stuck on any step:
1. Take a screenshot of the error/issue
2. Note which step you're on
3. Let me know and I'll help troubleshoot!

---

## 📚 Useful Links

- **GCP Console**: https://console.cloud.google.com/home/dashboard?project=cvstomize
- **Firebase Console**: https://console.firebase.google.com/project/cvstomize/overview
- **GCP Documentation**: https://cloud.google.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs

---

**Ready to proceed?** Let me know when you've completed these steps and we'll move on to Day 2! 🚀
