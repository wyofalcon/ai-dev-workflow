# Deploy CVstomize API from Cloud Shell

## Quick Deploy (Copy/Paste These Commands)

Open Cloud Shell: https://shell.cloud.google.com/?project=cvstomize

Then run:

```bash
# Set project
gcloud config set project cvstomize

# Create directory
mkdir -p ~/cvstomize-api
cd ~/cvstomize-api

# Upload method: Upload cvstomize-api.tar.gz via Cloud Shell UI, then:
tar -xzf ~/cvstomize-api.tar.gz
cd api

# Fix line endings and deploy
sed -i 's/\r$//' deploy-to-cloud-run.sh
chmod +x deploy-to-cloud-run.sh
./deploy-to-cloud-run.sh
```

## Upload Location

The tarball is at:
```
/mnt/storage/shared_windows/Cvstomize/cvstomize-api.tar.gz
```

Or in Windows:
```
\\wsl.localhost\Ubuntu\mnt\storage\shared_windows\Cvstomize\cvstomize-api.tar.gz
```

## After Deployment

1. **Get the URL**:
```bash
gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)'
```

2. **Test health**:
```bash
SERVICE_URL=$(gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)')
curl ${SERVICE_URL}/health
```

3. **Update frontend** (back on your local machine):
```bash
cd /mnt/storage/shared_windows/Cvstomize
nano .env
# Change REACT_APP_API_URL to the Cloud Run URL
```

4. **Rebuild frontend**:
```bash
npm run build
```

## Troubleshooting

If upload fails due to size, use:
```bash
# In Cloud Shell, manually create files (shown in full guide)
```

Or push to GitHub first:
```bash
# On local machine
cd /mnt/storage/shared_windows/Cvstomize
git init
git add .
git commit -m "feat: CVstomize v2.0 with full auth system"
git remote add origin https://github.com/wyofalcon/cvstomize.git
git push -u origin main

# Then in Cloud Shell
git clone https://github.com/wyofalcon/cvstomize.git
cd cvstomize/api
./deploy-to-cloud-run.sh
```
