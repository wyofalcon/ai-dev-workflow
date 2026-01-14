#!/bin/bash

# Start the local development environment using Docker Compose
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Starting CVstomize Local Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check for GCP credentials (optional - for Vertex AI)
if [ ! -f "gcp-key.json" ]; then
  echo "ℹ️  No gcp-key.json found (Vertex AI disabled - using mock AI)"
  if [ -f "api/cvstomize-deployer-key.json" ]; then
      echo "   Found api/cvstomize-deployer-key.json, copying..."
      cp api/cvstomize-deployer-key.json ./gcp-key.json
  fi
fi

# Build and start containers
echo "📦 Building and starting containers..."
docker compose up -d --build

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
sleep 8

# Run database migrations
echo "🗃️  Applying database migrations..."
docker exec cvstomize-api-local npx prisma migrate deploy 2>/dev/null || echo "   ⚠️  Migration skipped (may already be applied)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Local Development Environment Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Frontend:  http://localhost:3000"
echo "  🔌 Backend:   http://localhost:3001"
echo "  🗄️  Database:  localhost:5432"
echo "  📦 Redis:     localhost:6379"
echo ""
echo "  📚 Commands:"
echo "     docker compose logs -f     - View logs"
echo "     ./stop-local.sh            - Stop all services"
echo "     npm run test:e2e           - Run E2E tests"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
