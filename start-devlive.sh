#!/bin/bash

# Start DevLive Environment
# Uses REAL GCP services (Vertex AI, Cloud SQL) with dev tools enabled
# Like staging but with dev conveniences (dev auth, verbose logging, etc.)

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔥 Starting CVstomize DevLive Environment"
echo "     (Real GCP Services + Dev Tools)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check for GCP Service Account Key
if [ ! -f "gcp-key.json" ]; then
  echo "❌ Error: 'gcp-key.json' not found in $(pwd)"
  echo ""
  echo "   To set up DevLive, you need a GCP service account key with:"
  echo "   • Vertex AI User role"
  echo "   • Cloud SQL Client role (if using Cloud SQL)"
  echo ""
  echo "   Place it at: $(pwd)/gcp-key.json"
  exit 1
fi

# 2. Load environment from .env.devlive if it exists
if [ -f ".env.devlive" ]; then
  echo "📝 Loading environment from .env.devlive"
  set -a
  source .env.devlive
  set +a
fi

# 3. Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "⚠️  DATABASE_URL not set"
  echo ""
  echo "   Options:"
  echo "   1. Use Cloud SQL (staging-like):"
  echo "      export DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB'"
  echo ""
  echo "   2. Use local database (hybrid mode):"
  echo "      export DATABASE_URL='postgresql://dev_user:dev_password@database:5432/cvstomize_dev'"
  echo ""
  read -p "   Use local database? [Y/n]: " USE_LOCAL_DB
  if [ "$USE_LOCAL_DB" != "n" ] && [ "$USE_LOCAL_DB" != "N" ]; then
    export DATABASE_URL="postgresql://dev_user:dev_password@database:5432/cvstomize_dev?schema=public"
    echo "   ✓ Using local PostgreSQL database"
  else
    echo "   Please set DATABASE_URL and try again."
    exit 1
  fi
fi

# 4. Set GCP Project if not set
if [ -z "$GCP_PROJECT_ID" ]; then
  export GCP_PROJECT_ID="cvstomize"
  echo "📝 Using default GCP_PROJECT_ID: cvstomize"
fi

echo ""
echo "⚙️  DevLive Configuration:"
echo "   ├─ GCP Project:    $GCP_PROJECT_ID"
echo "   ├─ AI Mode:        Vertex AI (Real)"
echo "   ├─ Database:       ${DATABASE_URL:0:50}..."
echo "   ├─ Dev Auth:       Enabled"
echo "   ├─ Rate Limiting:  Disabled"
echo "   └─ Credentials:    gcp-key.json mounted"
echo ""

# 5. Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f docker-compose.yml -f docker-compose.devlive.yml down 2>/dev/null || true

# 6. Start DevLive environment
echo "📦 Starting DevLive containers..."
docker compose -f docker-compose.yml -f docker-compose.devlive.yml up -d --build

# 7. Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 8

# 8. Run database migrations if using local DB
if [[ "$DATABASE_URL" == *"database:5432"* ]]; then
  echo "🗃️  Applying database migrations..."
  docker exec cvstomize-api-local npx prisma migrate deploy 2>/dev/null || echo "   ⚠️  Migrations skipped (may already be applied)"
fi

# 9. Show status
echo ""
docker compose -f docker-compose.yml -f docker-compose.devlive.yml ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ DevLive Environment Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Frontend:  http://localhost:3000  (Dev Auth enabled)"
echo "  🔌 Backend:   http://localhost:3001  (Vertex AI active)"
echo "  🤖 AI Mode:   Vertex AI (REAL - costs may apply)"
echo ""
echo "  📚 Commands:"
echo "     docker compose -f docker-compose.yml -f docker-compose.devlive.yml logs -f"
echo "     ./stop-local.sh  (to stop all services)"
echo ""
echo "  ⚠️  Note: This uses REAL GCP services. AI calls will incur costs."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
