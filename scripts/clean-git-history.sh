#!/bin/bash
# Remove sensitive data from git history
# ⚠️ WARNING: This rewrites git history. Coordinate with team before running!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}⚠️  WARNING: This will rewrite git history!${NC}"
echo -e "${YELLOW}All team members will need to re-clone the repository.${NC}"
echo ""
echo "This script will remove:"
echo "  - Database passwords from all commits"
echo "  - CREDENTIALS_REFERENCE.md from history"
echo "  - Any .env files from history"
echo ""
read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM

if [[ "$CONFIRM" != "YES" ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Backing up current state...${NC}"
git branch backup-before-history-clean-$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}Installing git-filter-repo if needed...${NC}"
if ! command -v git-filter-repo &> /dev/null; then
    echo "git-filter-repo not found. Installing..."
    pip3 install git-filter-repo
fi

echo ""
echo -e "${BLUE}Step 1: Removing CREDENTIALS_REFERENCE.md from history...${NC}"
git filter-repo --invert-paths --path CREDENTIALS_REFERENCE.md --force

echo ""
echo -e "${BLUE}Step 2: Removing .env files from history...${NC}"
git filter-repo --invert-paths --path-glob '*.env' --path-glob '*.env.*' --force

echo ""
echo -e "${BLUE}Step 3: Replacing passwords in all files...${NC}"
cat > /tmp/password-replacements.txt <<EOF
CVst0mize_App_2025!==>REDACTED_PASSWORD
TEMP_PASSWORD_123!==>REDACTED_PASSWORD
EOF

git filter-repo --replace-text /tmp/password-replacements.txt --force
rm /tmp/password-replacements.txt

echo ""
echo -e "${GREEN}✓ Git history cleaned!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Force push to GitHub: git push --force --all origin"
echo "2. Notify team members to re-clone"
echo "3. Delete old clones to avoid accidentally pushing old history"
echo ""
echo -e "${RED}⚠️  After force push, old history is still in GitHub's cache for ~24 hours${NC}"
echo "   Consider creating a new private repo if highly sensitive"
