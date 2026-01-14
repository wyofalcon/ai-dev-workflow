#!/bin/bash
# CVstomize Secret Management CLI
# Single source of truth for all credentials

set -e

PROJECT_ID="cvstomize"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if user is authenticated
check_auth() {
    CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null)
    if [[ -z "$CURRENT_ACCOUNT" ]]; then
        echo -e "${RED}❌ Not authenticated with gcloud${NC}"
        echo "Run: gcloud auth login"
        exit 1
    fi
    echo -e "${GREEN}✓ Authenticated as: $CURRENT_ACCOUNT${NC}"
}

# List all secrets
list_secrets() {
    echo -e "${BLUE}📋 All Secrets in Secret Manager:${NC}"
    echo ""
    gcloud secrets list --project="$PROJECT_ID" --format="table(name,createTime,labels)"
}

# Get a secret value
get_secret() {
    local SECRET_NAME=$1
    if [[ -z "$SECRET_NAME" ]]; then
        echo -e "${RED}Usage: $0 get SECRET_NAME${NC}"
        exit 1
    fi

    echo -e "${BLUE}🔑 Retrieving: $SECRET_NAME${NC}"
    gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID"
}

# Create or update a secret
set_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2

    if [[ -z "$SECRET_NAME" ]]; then
        echo -e "${RED}Usage: $0 set SECRET_NAME [value]${NC}"
        echo "If value is not provided, you'll be prompted to enter it securely."
        exit 1
    fi

    # If no value provided, prompt for it (hidden input)
    if [[ -z "$SECRET_VALUE" ]]; then
        echo -e "${YELLOW}Enter value for $SECRET_NAME (input hidden):${NC}"
        read -s SECRET_VALUE
        echo ""
    fi

    # Check if secret exists
    if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
        echo -e "${YELLOW}⚠️  Secret exists. Adding new version...${NC}"
        echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
            --data-file=- \
            --project="$PROJECT_ID"
        echo -e "${GREEN}✓ Secret updated: $SECRET_NAME${NC}"
    else
        echo -e "${BLUE}📝 Creating new secret: $SECRET_NAME${NC}"
        echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" \
            --data-file=- \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --labels="app=cvstomize,managed-by=cli"
        echo -e "${GREEN}✓ Secret created: $SECRET_NAME${NC}"
    fi
}

# Generate a secure random password
generate_password() {
    openssl rand -base64 32
}

# Rotate database password
rotate_db_password() {
    echo -e "${BLUE}🔄 Rotating Database Password${NC}"
    echo ""

    # Generate new password
    NEW_PASSWORD=$(generate_password)
    echo -e "${GREEN}✓ Generated new secure password${NC}"

    # Update Cloud SQL
    echo -e "${BLUE}Updating Cloud SQL user password...${NC}"
    gcloud sql users set-password cvstomize_app \
        --instance=cvstomize-db \
        --password="$NEW_PASSWORD" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Cloud SQL password updated${NC}"

    # Update Secret Manager
    echo -e "${BLUE}Updating Secret Manager...${NC}"
    NEW_DB_URL="postgresql://cvstomize_app:$NEW_PASSWORD@localhost/cvstomize_production?host=/cloudsql/cvstomize:us-central1:cvstomize-db"
    echo -n "$NEW_DB_URL" | gcloud secrets versions add DATABASE_URL \
        --data-file=- \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ DATABASE_URL secret updated${NC}"

    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Redeploy Cloud Run services to pick up new password"
    echo "2. Test database connectivity"
    echo ""
    echo -e "${GREEN}✓ Database password rotation complete!${NC}"
}

# Export all secrets to .env file (for local dev)
export_env_file() {
    local ENV_FILE="${1:-.env.local}"

    echo -e "${BLUE}📤 Exporting secrets to $ENV_FILE${NC}"
    echo -e "${YELLOW}⚠️  This file contains sensitive data. Do NOT commit to git!${NC}"
    echo ""

    cat > "$ENV_FILE" <<EOF
# CVstomize Environment Variables
# Generated: $(date)
# DO NOT COMMIT TO GIT!

# Environment
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# GCP
GCP_PROJECT_ID=cvstomize

# Database (from Secret Manager)
DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL --project="$PROJECT_ID" 2>/dev/null || echo "NOT_SET")

# JWT Secret (from Secret Manager)
JWT_SECRET=$(gcloud secrets versions access latest --secret=JWT_SECRET --project="$PROJECT_ID" 2>/dev/null || echo "NOT_SET")

# Cloud Storage
GCS_RESUMES_BUCKET=$(gcloud secrets versions access latest --secret=GCS_BUCKET_NAME --project="$PROJECT_ID" 2>/dev/null || echo "cvstomize-resumes-prod")
ENABLE_CLOUD_STORAGE=true

# Firebase (if needed)
FIREBASE_PROJECT_ID=$(gcloud secrets versions access latest --secret=FIREBASE_PROJECT_ID --project="$PROJECT_ID" 2>/dev/null || echo "cvstomize")

# CORS
CORS_ORIGIN=http://localhost:3000

EOF

    echo -e "${GREEN}✓ Exported to $ENV_FILE${NC}"
    echo ""
    echo -e "${YELLOW}Remember to add $ENV_FILE to .gitignore!${NC}"
}

# Initialize secrets for a new environment
init_environment() {
    local ENV=$1

    if [[ -z "$ENV" ]]; then
        echo -e "${RED}Usage: $0 init [dev|staging|production]${NC}"
        exit 1
    fi

    echo -e "${BLUE}🚀 Initializing $ENV environment${NC}"
    echo ""

    # Generate JWT secret if not exists
    if ! gcloud secrets describe JWT_SECRET_$ENV --project="$PROJECT_ID" &>/dev/null; then
        echo -e "${BLUE}Creating JWT_SECRET_$ENV...${NC}"
        JWT_SECRET=$(generate_password)
        echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET_$ENV \
            --data-file=- \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --labels="app=cvstomize,env=$ENV"
        echo -e "${GREEN}✓ JWT_SECRET_$ENV created${NC}"
    fi

    # Create database URL secret (placeholder)
    if ! gcloud secrets describe DATABASE_URL_$ENV --project="$PROJECT_ID" &>/dev/null; then
        echo -e "${BLUE}Creating DATABASE_URL_$ENV...${NC}"
        echo -n "postgresql://cvstomize_app:CHANGE_ME@localhost/cvstomize_$ENV?host=/cloudsql/cvstomize:us-central1:cvstomize-db-$ENV" | \
            gcloud secrets create DATABASE_URL_$ENV \
            --data-file=- \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --labels="app=cvstomize,env=$ENV"
        echo -e "${YELLOW}⚠️  DATABASE_URL_$ENV created with placeholder. Update with real password!${NC}"
    fi

    # Create GCS bucket name secret
    if ! gcloud secrets describe GCS_BUCKET_NAME_$ENV --project="$PROJECT_ID" &>/dev/null; then
        echo -e "${BLUE}Creating GCS_BUCKET_NAME_$ENV...${NC}"
        echo -n "cvstomize-resumes-$ENV" | gcloud secrets create GCS_BUCKET_NAME_$ENV \
            --data-file=- \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --labels="app=cvstomize,env=$ENV"
        echo -e "${GREEN}✓ GCS_BUCKET_NAME_$ENV created${NC}"
    fi

    echo ""
    echo -e "${GREEN}✓ $ENV environment initialized!${NC}"
}

# Show help
show_help() {
    cat <<EOF
${BLUE}CVstomize Secret Management CLI${NC}

${GREEN}Usage:${NC}
  $0 <command> [options]

${GREEN}Commands:${NC}
  ${YELLOW}list${NC}                      List all secrets
  ${YELLOW}get${NC} <secret-name>         Get a secret value
  ${YELLOW}set${NC} <secret-name> [value] Create/update a secret
  ${YELLOW}generate${NC}                  Generate a secure random password
  ${YELLOW}rotate-db${NC}                 Rotate database password
  ${YELLOW}export${NC} [file]             Export secrets to .env file (default: .env.local)
  ${YELLOW}init${NC} <env>                Initialize secrets for new environment (dev/staging/production)
  ${YELLOW}help${NC}                      Show this help message

${GREEN}Examples:${NC}
  # List all secrets
  $0 list

  # Get database URL
  $0 get DATABASE_URL

  # Set a new secret (will prompt for value)
  $0 set SENTRY_DSN

  # Set a secret with value directly
  $0 set API_KEY "sk-1234567890"

  # Generate a secure password
  $0 generate

  # Rotate database password
  $0 rotate-db

  # Export secrets for local development
  $0 export .env.local

  # Initialize staging environment
  $0 init staging

${YELLOW}Security Notes:${NC}
  - All secrets are stored in Google Cloud Secret Manager
  - Secrets are encrypted at rest and in transit
  - Access is logged via Cloud Audit Logs
  - Never commit .env.local files to git!

EOF
}

# Main command dispatcher
main() {
    check_auth

    case "${1:-help}" in
        list)
            list_secrets
            ;;
        get)
            get_secret "$2"
            ;;
        set)
            set_secret "$2" "$3"
            ;;
        generate)
            generate_password
            ;;
        rotate-db)
            rotate_db_password
            ;;
        export)
            export_env_file "$2"
            ;;
        init)
            init_environment "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
