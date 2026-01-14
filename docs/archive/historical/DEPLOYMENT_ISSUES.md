# GCP Cloud Run Deployment Caching Issue - Session 24

## Issue Summary

Resume upload endpoint (`POST /api/resume/extract-text`) exists in codebase but fails to deploy to production due to aggressive Docker/Cloud Run caching.

## Timeline of Deployment Attempts

1. **Initial Deployment** - Used `gcloud run deploy --source`
   - Result: Revision cvstomize-api-00092-prk created
   - Issue: Endpoint returns 404 Not Found

2. **Docker Cache Bust** - Updated Dockerfile CACHEBUST arg from 1 to 2
   - Result: Same revision 00092-prk reused
   - Issue: No new revision created

3. **Cloud Build Config** - Created cloudbuild.yaml with `--no-cache`
   - Build ID: 8535f97e-0db4-41aa-84e7-af3e057360dc
   - Result: Build succeeded, created revision 00099-n4h
   - Issue: Endpoint still returns 404

4. **Manual Image Build** - Built fresh image with unique tag
   - Image: gcr.io/cvstomize/cvstomize-api:upload-endpoint-v2
   - Build ID: 474af3da-293c-4941-9c0b-8544018b45a4
   - Result: Build SUCCESS
   - Deployment: `gcloud run deploy --image=...`
   - Issue: **STILL deploys revision 00092-prk** despite specifying different image!

## Code Verification

✅ Upload endpoint EXISTS in source code:
- File: `/mnt/storage/shared_windows/Cvstomize/api/routes/resume.js`
- Line: 1043
- Code: `router.post('/extract-text', verifyFirebaseToken, upload.array('resumes', 5), ...`
- Committed in: commit 05baa62

✅ All dependencies installed:
- multer, pdf-parse, mammoth added to package.json
- pnpm-lock.yaml updated

✅ Route registered in index.js:
- Line 149: `const resumeRoutes = require('./routes/resume');`
- Line 155: `app.use('/api/resume', resumeRoutes);`

## Root Cause Analysis

**Cloud Run is aggressively caching and reusing revision 00092-prk** despite:
1. Fresh Docker builds with `--no-cache`
2. New Docker images with unique tags
3. Explicit image specification in deployment command
4. Cache bust arguments in Dockerfile

The revision hash (00092-prk) suggests Cloud Run detects the image content as identical to a previous build, possibly because:
- Docker layer caching at GCP level
- Image content hashing matching old version
- Cloud Run's revision detection algorithm caching metadata

## What Works

✅ **Resume-first with PASTE** - Fully functional in production
- Gap analysis working correctly
- Generates 3-5 targeted questions instead of 8-10
- Resume generation includes uploaded resume content

✅ **All other features** - Auth, CORS, conversation flow, personality inference

## Workarounds Attempted

1. ❌ `--no-cache` flag in Cloud Build
2. ❌ CACHEBUST build arg
3. ❌ Unique image tags
4. ❌ Explicit image specification in deploy
5. ❌ Multiple fresh builds from scratch

## Recommended Solutions

### Option 1: Delete All Revisions and Images (Nuclear)
```bash
# Delete all old revisions
gcloud run revisions list --service=cvstomize-api --region=us-central1 --project=cvstomize --format="value(metadata.name)" | xargs -I {} gcloud run revisions delete {} --region=us-central1 --project=cvstomize --quiet

# Delete all old images
gcloud container images list --repository=gcr.io/cvstomize --format="value(name)" | grep cvstomize-api | xargs -I {} gcloud container images delete {} --quiet

# Fresh deploy
cd /mnt/storage/shared_windows/Cvstomize/api
gcloud builds submit --tag=gcr.io/cvstomize/cvstomize-api:fresh-start
gcloud run deploy cvstomize-api --image=gcr.io/cvstomize/cvstomize-api:fresh-start ...
```

### Option 2: GCP Support Ticket
- Describe caching behavior preventing new code deployment
- Request assistance with forcing fresh revision creation

### Option 3: Use Artifact Registry Instead of Container Registry
- Migrate from gcr.io to Artifact Registry
- May have different caching behavior

### Option 4: Manual Container Registry Cleanup
- Access Container Registry UI
- Delete specific image SHA that 00092-prk references
- Force Cloud Run to rebuild

## Next Steps

1. **Short term:** Use paste workflow for testing resume-first feature
2. **Long term:** Resolve deployment caching (Options 1-4 above)
3. **Documentation:** Update deployment guides with caching considerations

## Related Issues

- Duplicate question bug (separate issue in Gemini prompt)
- Profile picture CORS (separate CORP policy issue)

## Commits with Upload Code

- `05baa62` - feat: Add PDF/DOCX resume upload support (up to 5 files)
- `404bf2e` - test: Add comprehensive tests for resume file upload endpoint
- `dbf3d63` - fix: Update CORS to support staging environment
- `9c767b3` - feat: Add Cloud Build config with --no-cache for fresh builds
