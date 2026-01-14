#!/bin/bash
# CVstomize - Secret Manager Setup Script
# This script creates all required secrets for Cloud Run deployment
# Run this with YOUR user account (not service account)

set -e  # Exit on error

PROJECT_ID="cvstomize"
DEPLOYER_SA="cvstomize-deployer@cvstomize.iam.gserviceaccount.com"

echo "🔐 CVstomize Secret Manager Setup"
echo "=================================="
echo ""
echo "⚠️  Prerequisites:"
echo "  1. You must be authenticated as a PROJECT OWNER (ashley.caban.c@gmail.com or wyofalcon@gmail.com)"
echo "  2. You must have the Secret Manager Admin role"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."
echo ""

# Check authentication
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
echo "📝 Current account: $CURRENT_ACCOUNT"

if [[ "$CURRENT_ACCOUNT" == *"@cvstomize.iam.gserviceaccount.com" ]]; then
    echo ""
    echo "❌ ERROR: You are authenticated as a service account!"
    echo "   Please authenticate as a user account first:"
    echo ""
    echo "   gcloud auth login"
    echo "   gcloud config set project cvstomize"
    echo ""
    exit 1
fi

echo ""
echo "✅ Authenticated as user account"
echo ""

# Function to create secret if it doesn't exist
create_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    local DESCRIPTION=$3

    echo "📌 Processing secret: $SECRET_NAME"

    # Check if secret exists
    if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
        echo "   ℹ️  Secret already exists. Checking if it has a value..."

        # Try to access latest version
        if gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
            echo "   ✅ Secret has a value. Skipping."
            return 0
        else
            echo "   ⚠️  Secret exists but has no versions. Adding version..."
            echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
                --data-file=- \
                --project="$PROJECT_ID"
            echo "   ✅ Version added"
        fi
    else
        echo "   📝 Creating new secret..."
        echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" \
            --data-file=- \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --labels="app=cvstomize,managed-by=setup-script"

        if [ $? -eq 0 ]; then
            echo "   ✅ Secret created successfully"
        else
            echo "   ❌ Failed to create secret"
            return 1
        fi
    fi

    # Grant access to deployer service account
    echo "   🔑 Granting access to $DEPLOYER_SA..."
    gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
        --member="serviceAccount:$DEPLOYER_SA" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID" &>/dev/null

    echo "   ✅ Access granted"
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating Secrets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. DATABASE_URL
DATABASE_URL="postgresql://cvstomize_app:CVst0mize_App_2025!@34.67.70.34:5432/cvstomize_production?schema=public"
create_secret "DATABASE_URL" "$DATABASE_URL" "PostgreSQL connection string for production"

# 2. GEMINI_API_KEY (prompt user)
echo "📌 Processing secret: GEMINI_API_KEY"
echo ""
echo "   ⚠️  GEMINI_API_KEY is required for AI resume generation"
echo ""
echo "   To get your API key:"
echo "   1. Go to: https://aistudio.google.com/app/apikey"
echo "   2. Click 'Create API Key'"
echo "   3. Select project: cvstomize"
echo "   4. Copy the key"
echo ""

# Check if secret already exists with value
if gcloud secrets describe GEMINI_API_KEY --project="$PROJECT_ID" &>/dev/null; then
    if gcloud secrets versions access latest --secret=GEMINI_API_KEY --project="$PROJECT_ID" &>/dev/null 2>&1; then
        EXISTING_KEY=$(gcloud secrets versions access latest --secret=GEMINI_API_KEY --project="$PROJECT_ID" 2>/dev/null)
        if [ -n "$EXISTING_KEY" ] && [ "$EXISTING_KEY" != "YOUR_GEMINI_API_KEY_HERE" ]; then
            echo "   ✅ GEMINI_API_KEY already exists with a value. Skipping."
            echo ""
        else
            read -p "   Enter your Gemini API key (or press ENTER to skip): " GEMINI_KEY
            if [ -n "$GEMINI_KEY" ]; then
                create_secret "GEMINI_API_KEY" "$GEMINI_KEY" "Gemini AI API key for resume generation"
            else
                echo "   ⚠️  Skipped. You'll need to add this manually later."
                echo ""
            fi
        fi
    else
        read -p "   Enter your Gemini API key (or press ENTER to skip): " GEMINI_KEY
        if [ -n "$GEMINI_KEY" ]; then
            create_secret "GEMINI_API_KEY" "$GEMINI_KEY" "Gemini AI API key for resume generation"
        else
            echo "   ⚠️  Skipped. You'll need to add this manually later."
            echo ""
        fi
    fi
else
    read -p "   Enter your Gemini API key (or press ENTER to skip): " GEMINI_KEY
    if [ -n "$GEMINI_KEY" ]; then
        create_secret "GEMINI_API_KEY" "$GEMINI_KEY" "Gemini AI API key for resume generation"
    else
        echo "   ⚠️  Skipped. You'll need to add this manually later."
        echo ""
    fi
fi

# 3. JWT_SECRET (generate random)
echo "📌 Processing secret: JWT_SECRET"
if gcloud secrets describe JWT_SECRET --project="$PROJECT_ID" &>/dev/null; then
    if gcloud secrets versions access latest --secret=JWT_SECRET --project="$PROJECT_ID" &>/dev/null 2>&1; then
        echo "   ✅ JWT_SECRET already exists with a value. Skipping."
        echo ""
    else
        JWT_SECRET=$(openssl rand -base64 32)
        create_secret "JWT_SECRET" "$JWT_SECRET" "JWT signing secret for authentication"
    fi
else
    echo "   📝 Generating random JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    create_secret "JWT_SECRET" "$JWT_SECRET" "JWT signing secret for authentication"
fi

# 4. GCS_BUCKET_NAME
GCS_BUCKET="cvstomize-resumes-prod"
create_secret "GCS_BUCKET_NAME" "$GCS_BUCKET" "Google Cloud Storage bucket name for resumes"

# 5. FIREBASE secrets (if needed - currently NOT used in code)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Optional Firebase Secrets (not currently used)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  The following secrets are configured in Cloud Run but NOT used in the code:"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - FIREBASE_CLIENT_EMAIL"
echo ""
echo "   These can be created later when Firebase backend auth is implemented."
echo "   For now, we'll create placeholder values to prevent deployment errors."
echo ""

# Create placeholder Firebase secrets
create_secret "FIREBASE_PROJECT_ID" "cvstomize" "Firebase project ID (placeholder)"
create_secret "FIREBASE_CLIENT_EMAIL" "not-used-yet@placeholder.com" "Firebase client email (placeholder)"
create_secret "FIREBASE_PRIVATE_KEY" "NOT_USED_YET_PLACEHOLDER_KEY" "Firebase private key (placeholder)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secret Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Secrets created:"
gcloud secrets list --project="$PROJECT_ID" --filter="labels.app=cvstomize" --format="table(name,createTime)"
echo ""
echo "🔑 Service account access:"
echo "   $DEPLOYER_SA has secretAccessor role on all secrets"
echo ""
echo "✅ You can now deploy to Cloud Run!"
echo ""
echo "Next steps:"
echo "  1. Route traffic to new revision: gcloud run services update-traffic cvstomize-api --to-revisions cvstomize-api-00060-fvc=100 --region us-central1"
echo "  2. Test Gemini fix with job description analysis"
echo ""
