#!/bin/bash

# Start the application environment with ACTUAL BACKEND services
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Starting CVstomize PROD-LIKE Environment"
echo "     (Using Real Database & Vertex AI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check for GCP Service Account Key
if [ ! -f "gcp-key.json" ]; then
  echo "❌ Error: 'gcp-key.json' not found in $(pwd)"
  echo "   Please place your Google Cloud Service Account key in this directory."
  echo "   It should have permissions for Vertex AI and Cloud SQL (if using IAM)."
  exit 1
fi

# 2. Check for GCP Project ID
if [ -z "$GCP_PROJECT_ID" ]; then
  read -p "📝 Enter GCP Project ID: " INPUT_PROJECT_ID
  if [ -z "$INPUT_PROJECT_ID" ]; then
    echo "❌ Error: GCP Project ID is required."
    exit 1
  fi
  export GCP_PROJECT_ID=$INPUT_PROJECT_ID
fi

# 3. Check for Database URL
if [ -z "$DATABASE_URL" ]; then
  echo "ℹ️  DATABASE_URL environment variable is not set."
  echo "   Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
  read -p "📝 Enter Remote Database URL: " INPUT_DB_URL
  if [ -z "$INPUT_DB_URL" ]; then
    echo "❌ Error: Database URL is required for prod-like environment."
    exit 1
  fi
  export DATABASE_URL=$INPUT_DB_URL
fi

echo ""
echo "⚙️  Configuration:"
echo "   • Project ID:   $GCP_PROJECT_ID"
echo "   • Database:     (Set)"
echo "   • AI Mode:      Vertex AI (Real)"
echo "   • Credentials:  Mounted gcp-key.json"
echo ""

# 4. Start Docker Compose with Override
echo "📦 Starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod-backend.yml up --build

