#!/bin/bash
# CVstomize API - Deploy from Cloud Shell
# Copy and paste this entire script into Cloud Shell

set -e

echo "🚀 Creating CVstomize API structure in Cloud Shell..."

# Create directory structure
mkdir -p ~/cvstomize-api/{middleware,routes,utils,prisma}
cd ~/cvstomize-api

# Create package.json
cat > package.json << 'PKGJSON'
{
  "name": "cvstomize-api",
  "version": "1.0.0",
  "description": "CVstomize Backend API",
  "main": "index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@google-cloud/secret-manager": "^6.1.1",
    "@google-cloud/storage": "^7.17.2",
    "@prisma/client": "^6.18.0",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.2.1",
    "firebase-admin": "^13.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^6.18.0",
    "winston": "^3.18.3"
  }
}
PKGJSON

# Create Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN mkdir -p logs
EXPOSE 3001
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "index.js"]
DOCKERFILE

# Create .dockerignore
cat > .dockerignore << 'DOCKERIGNORE'
node_modules
*.log
.env
.git
README.md
DOCKERIGNORE

echo "✅ Files created. Now building and deploying..."

# Build and deploy
gcloud config set project cvstomize

gcloud builds submit --tag gcr.io/cvstomize/cvstomize-api .

gcloud run deploy cvstomize-api \
  --image gcr.io/cvstomize/cvstomize-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=3001,GCP_PROJECT_ID=cvstomize,LOG_LEVEL=info \
  --add-cloudsql-instances cvstomize:us-central1:cvstomize-db \
  --set-secrets DATABASE_URL=cvstomize-db-connection-string:latest

# Get service URL
SERVICE_URL=$(gcloud run services describe cvstomize-api --region us-central1 --format 'value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 Deployment Complete!"
echo "=========================================================="
echo ""
echo "Service URL: ${SERVICE_URL}"
echo "Health Check: ${SERVICE_URL}/health"
echo ""
echo "Test it:"
echo "  curl ${SERVICE_URL}/health"
echo ""
