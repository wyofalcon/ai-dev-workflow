# 🔐 Password Access - Quick Reference Card

**Keep this handy!** All passwords are in Google Cloud Secret Manager.

---

## 📋 ONE-LINER COMMANDS

```bash
# Database password
./scripts/manage-secrets.sh get DATABASE_URL

# List all secrets
cd /mnt/storage/shared_windows/Cvstomize && ./scripts/manage-secrets.sh list

# Just the password (extract from connection string)
cd /mnt/storage/shared_windows/Cvstomize && ./scripts/manage-secrets.sh get DATABASE_URL | grep -oP 'cvstomize_app:\K[^@]+'
```

---

## 🎯 MOST COMMON SECRETS

| What You Need | Command |
|--------------|---------|
| **Database Password** | `./scripts/manage-secrets.sh get DATABASE_URL` |
| **JWT Secret** | `./scripts/manage-secrets.sh get JWT_SECRET` |
| **Firebase Keys** | `./scripts/manage-secrets.sh get FIREBASE_PRIVATE_KEY` |
| **Storage Bucket** | `./scripts/manage-secrets.sh get GCS_BUCKET_NAME` |
| **Gemini API Key** | `./scripts/manage-secrets.sh get GEMINI_API_KEY` |

---

## ⚡ QUICK ACTIONS

### Test Database Connection
```bash
# Get password
PASSWORD=$(cd /mnt/storage/shared_windows/Cvstomize && ./scripts/manage-secrets.sh get DATABASE_URL | grep -oP 'cvstomize_app:\K[^@]+')

# Test connection via proxy (port 5435)
PGPASSWORD="$PASSWORD" psql -h 127.0.0.1 -p 5435 -U cvstomize_app -d cvstomize_production -c "SELECT NOW();"
```

### Export All Secrets for Local Dev
```bash
cd /mnt/storage/shared_windows/Cvstomize
./scripts/manage-secrets.sh export .env.local
```

### Generate New Secure Password
```bash
cd /mnt/storage/shared_windows/Cvstomize
./scripts/manage-secrets.sh generate
```

---

## 🌐 WEB CONSOLE

**Direct Link:** https://console.cloud.google.com/security/secret-manager?project=cvstomize

---

## 📊 CURRENT STATE (Session 19)

**Production Database:**
- Version: 8 (Secret Manager)
- Set: 2025-11-07 21:58 UTC
- Next Rotation: 2026-02-05 (90 days)
- Status: ✅ Working

**How to Verify:**
```bash
cd /mnt/storage/shared_windows/Cvstomize
./scripts/manage-secrets.sh get DATABASE_URL
# Should show: postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@localhost/...
```

---

## 🔄 PASSWORD ROTATION

When it's time to rotate (every 90 days):

```bash
cd /mnt/storage/shared_windows/Cvstomize
./scripts/manage-secrets.sh rotate-db
```

**⚠️ IMPORTANT:** Always test on staging first!

---

## ❓ TROUBLESHOOTING

**Problem:** `manage-secrets.sh: command not found`
**Solution:** Make sure you're in the project root:
```bash
cd /mnt/storage/shared_windows/Cvstomize
ls -la scripts/manage-secrets.sh  # Should show the file
```

**Problem:** `Not authenticated with gcloud`
**Solution:** 
```bash
gcloud auth list  # Check who's authenticated
gcloud config set project cvstomize
```

**Problem:** Need password but don't have gcloud access
**Solution:** Ask team member with access to run command and securely share output

---

## 📖 MORE INFO

- **Full Guide:** [CREDENTIALS_SECURE.md](CREDENTIALS_SECURE.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md#-how-to-retrieve-passwords-read-this-first)
- **Setup Guide:** [WORLD_CLASS_SETUP.md](WORLD_CLASS_SETUP.md)

---

**Last Updated:** 2025-11-07 (Session 19)
**Status:** ✅ All secrets accessible via Secret Manager
