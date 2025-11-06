#!/bin/bash
# Grant permissions to cvstomize-deployer service account
# Run this with Owner/Admin credentials (not the service account itself)

set -e

echo "🔐 Granting permissions to cvstomize-deployer service account..."
echo ""

# Grant Cloud SQL Client (to connect to Cloud SQL)
echo "1️⃣ Granting Cloud SQL Client role..."
gcloud projects add-iam-policy-binding cvstomize \
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Cloud SQL Admin (to run gcloud sql connect)
echo "2️⃣ Granting Cloud SQL Admin role..."
gcloud projects add-iam-policy-binding cvstomize \
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

# Grant Secret Manager Accessor (to read secrets like postgres password)
echo "3️⃣ Granting Secret Manager Accessor role..."
gcloud projects add-iam-policy-binding cvstomize \
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant Logging Viewer (to read Cloud Run/Build logs)
echo "4️⃣ Granting Logging Viewer role..."
gcloud projects add-iam-policy-binding cvstomize \
  --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" \
  --role="roles/logging.viewer"

echo ""
echo "✅ All permissions granted!"
echo ""
echo "📝 Next steps:"
echo "  1. Wait 60 seconds for permissions to propagate"
echo "  2. Connect to database: gcloud sql connect cvstomize-db --user=postgres --database=cvstomize_production"
echo "  3. Run: ALTER TABLE resumes OWNER TO cvstomize_app;"
echo "  4. Run: gcloud run jobs execute cvstomize-migrate --region us-central1"
echo ""
