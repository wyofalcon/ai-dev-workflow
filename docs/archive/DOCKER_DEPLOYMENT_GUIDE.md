# CVstomize Docker Deployment Guide

**Complete containerization with PostgreSQL, Redis, Backend API, and Frontend**

---

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CVstomize Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐               │
│  │   Frontend   │◄────►│   Backend    │               │
│  │  (React +    │      │  (Node.js +  │               │
│  │   Nginx)     │      │   Prisma)    │               │
│  └──────────────┘      └──────┬───────┘               │
│        :80                :3001│                        │
│                                │                        │
│                     ┌──────────▼────────┐              │
│                     │    PostgreSQL     │              │
│                     │     Database      │              │
│                     └──────────┬────────┘              │
│                          :5432 │                        │
│                                │                        │
│                     ┌──────────▼────────┐              │
│                     │      Redis        │              │
│                     │     (Cache)       │              │
│                     └───────────────────┘              │
│                          :6379                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### 1. Clone Repository

```bash
git clone https://github.com/wyofalcon/cvstomize.git
cd cvstomize
git checkout dev
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required changes in .env:**
- `POSTGRES_PASSWORD` - Strong password
- `JWT_SECRET` - 32+ character secret
- `REACT_APP_FIREBASE_*` - Your Firebase credentials

### 3. Add Firebase Admin Key

```bash
# Create secrets directory
mkdir -p secrets

# Add your Firebase Admin SDK key
# Download from Firebase Console → Project Settings → Service Accounts
cp /path/to/your-firebase-admin-key.json secrets/firebase-admin-key.json
```

### 4. Build and Start

```bash
# Build all services
docker-compose build

# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Verify Deployment

```bash
# Check all services are healthy
docker-compose ps

# Expected output:
# cvstomize-db          Up (healthy)
# cvstomize-redis       Up (healthy)
# cvstomize-api         Up (healthy)
# cvstomize-frontend    Up (healthy)

# Test backend health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs (if configured)

---

## 🛠️ Development Setup

For local development with hot-reload:

```bash
# Use development docker-compose
docker-compose -f docker-compose.dev.yml up

# Or with rebuild
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

**Development Features:**
- ✅ Hot reload for backend (nodemon)
- ✅ Hot reload for frontend (CRA)
- ✅ Source code mounted as volumes
- ✅ Debug ports exposed
- ✅ Separate database (cvstomize_dev)

---

## 📊 Service Details

### Frontend (Port 3000)
- **Image**: Custom (Node 20 + Nginx Alpine)
- **Build**: Multi-stage (builder + production)
- **Files**: `/usr/share/nginx/html`
- **Config**: `nginx.conf`
- **Health**: HTTP GET on `/`

### Backend (Port 3001)
- **Image**: Custom (Node 20 Alpine)
- **Runtime**: Node.js with Prisma ORM
- **Database**: PostgreSQL via Prisma
- **Cache**: Redis (optional)
- **Health**: HTTP GET on `/health`

### PostgreSQL (Port 5432)
- **Image**: postgres:15-alpine
- **Database**: cvstomize
- **User**: cvstomize_user
- **Volume**: `postgres_data`
- **Migrations**: Auto-applied on startup

### Redis (Port 6379)
- **Image**: redis:7-alpine
- **Persistence**: AOF enabled
- **Volume**: `redis_data`
- **Use**: Caching, sessions

---

## 🔧 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f [service-name]

# Execute command in service
docker-compose exec backend sh
docker-compose exec database psql -U cvstomize_user -d cvstomize
```

### Database Operations

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Database backup
docker-compose exec database pg_dump -U cvstomize_user cvstomize > backup.sql

# Database restore
docker-compose exec -T database psql -U cvstomize_user cvstomize < backup.sql
```

### Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run backend tests with coverage
docker-compose exec backend npm run test:coverage

# Run frontend tests
docker-compose exec frontend npm test
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Full cleanup
docker-compose down -v --rmi all --remove-orphans
```

---

## 🚢 Production Deployment

### Option 1: Docker Compose (Single Server)

```bash
# Use production compose file
docker-compose -f docker-compose.yml up -d

# Or rename it
mv docker-compose.yml docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

**Before deploying:**
1. Update `.env` with production values
2. Use strong passwords
3. Configure SSL/TLS (nginx)
4. Set up reverse proxy (Caddy/nginx)
5. Configure backups
6. Set up monitoring

### Option 2: Google Cloud Run (Current Setup)

CVstomize is deployed on Google Cloud Run:

```bash
# Backend
gcloud run deploy cvstomize-api \
  --source ./api \
  --region us-central1 \
  --allow-unauthenticated

# Frontend
gcloud run deploy cvstomize-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Cloud SQL:**
- Database: Cloud SQL PostgreSQL
- Connection: Unix socket or Cloud SQL Proxy

### Option 3: Kubernetes (Scalable)

For high-traffic production:

```bash
# Convert docker-compose to Kubernetes manifests
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f .
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use Docker secrets in production
- ✅ Rotate secrets regularly
- ✅ Use strong passwords (32+ characters)

### 2. Network Security
- ✅ Use internal Docker network
- ✅ Expose only necessary ports
- ✅ Configure firewall rules
- ✅ Use HTTPS in production

### 3. Database Security
- ✅ Non-root database user
- ✅ Regular backups
- ✅ Encrypted connections (SSL)
- ✅ Access control (pg_hba.conf)

### 4. Container Security
- ✅ Use official base images
- ✅ Scan for vulnerabilities
- ✅ Run as non-root user
- ✅ Read-only filesystems where possible

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 replicas
docker-compose up -d --scale backend=3

# Use load balancer (nginx/HAProxy)
# Configure in docker-compose.yml
```

### Vertical Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs [service-name]

# Check service status
docker-compose ps

# Rebuild service
docker-compose build --no-cache [service-name]
docker-compose up -d [service-name]
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose exec database pg_isready -U cvstomize_user

# Check connection string
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec backend npx prisma db push
```

### Frontend Can't Reach Backend

```bash
# Check network
docker network ls
docker network inspect cvstomize_cvstomize-network

# Verify backend is accessible
docker-compose exec frontend curl http://backend:3001/health

# Check CORS settings
docker-compose logs backend | grep CORS
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Use different ports in .env
FRONTEND_PORT=3010
API_PORT=3002
```

---

## 📝 Environment Variables Reference

See [.env.example](.env.example) for complete list.

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `GOOGLE_APPLICATION_CREDENTIALS` - Firebase Admin SDK path
- `REACT_APP_API_URL` - Backend API URL for frontend

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main, dev ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend
        run: docker build -t cvstomize-api ./api
      
      - name: Build Frontend
        run: docker build -t cvstomize-frontend .
      
      - name: Run Tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [React in Docker](https://create-react-app.dev/docs/deployment/)

---

## ✅ Health Check Endpoints

- **Backend**: `GET http://localhost:3001/health`
- **Frontend**: `GET http://localhost:3000/`
- **Database**: `pg_isready` command
- **Redis**: `redis-cli ping`

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Open issue on GitHub
4. Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: Session 13 (Nov 2025)  
**Docker Compose Version**: 3.8  
**Status**: ✅ Production Ready
