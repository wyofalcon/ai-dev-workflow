#!/bin/bash
# CVstomize Developer Onboarding
# Walks new collaborators through setting up their AI tools

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉 Welcome to CVstomize!"
echo "  Let's set up your Builder/Auditor workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for whiptail
if ! command -v whiptail &> /dev/null; then
    echo "Installing UI components..."
    sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null 2>&1
fi

# Step 1: Choose AI CLI
AI_CHOICE=$(whiptail --title "🤖 Choose Your AI Assistant" \
--menu "Which AI CLI do you want to use as your Builder?" 15 60 3 \
"1" "Gemini CLI  (Google - requires Google account)" \
"2" "Claude CLI  (Anthropic - requires API key)" \
"3" "Skip        (I'll set this up later)" \
3>&1 1>&2 2>&3)

case $AI_CHOICE in
    1)
        echo ""
        echo "📦 Setting up Gemini CLI..."
        if ! command -v gemini &> /dev/null; then
            npm install -g @google/gemini-cli 2>/dev/null || true
        fi
        
        echo ""
        echo "🔐 Gemini CLI Authentication"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Options:"
        echo "  1. Google Account (recommended if you have Gemini Advanced/Ultra)"
        echo "  2. API Key (free tier from Google AI Studio)"
        echo ""
        
        AUTH_CHOICE=$(whiptail --title "Gemini Authentication" \
        --menu "How do you want to authenticate?" 12 60 2 \
        "1" "Google Account (OAuth) - for Gemini Ultra subscribers" \
        "2" "API Key - free tier from aistudio.google.com" \
        3>&1 1>&2 2>&3)
        
        mkdir -p ~/.gemini
        if [ "$AUTH_CHOICE" = "1" ]; then
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "oauth"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            echo "✓ Configured for OAuth. Run 'gemini' to authenticate."
        else
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "gemini-api-key"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            echo ""
            echo "To get your API key:"
            echo "  1. Go to: https://aistudio.google.com/app/apikey"
            echo "  2. Create a new API key"
            echo "  3. Run 'gemini' and paste the key when prompted"
        fi
        echo ""
        echo "✅ Gemini CLI installed! Run 'gemini' to start."
        ;;
        
    2)
        echo ""
        echo "📦 Setting up Claude CLI..."
        if ! command -v claude &> /dev/null; then
            npm install -g @anthropic-ai/claude-code 2>/dev/null || true
        fi
        
        echo ""
        echo "🔐 Claude CLI Authentication"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "You need an Anthropic API key."
        echo ""
        echo "To get your API key:"
        echo "  1. Go to: https://console.anthropic.com/settings/keys"
        echo "  2. Create a new API key"
        echo "  3. Set it in your environment:"
        echo ""
        echo "     export ANTHROPIC_API_KEY='your-key-here'"
        echo ""
        echo "  Or add to ~/.bashrc for persistence:"
        echo "     echo 'export ANTHROPIC_API_KEY=\"your-key\"' >> ~/.bashrc"
        echo ""
        
        if whiptail --title "Set API Key Now?" --yesno "Do you want to enter your Anthropic API key now?" 8 50; then
            API_KEY=$(whiptail --title "Anthropic API Key" --passwordbox "Paste your API key:" 8 70 3>&1 1>&2 2>&3)
            if [ -n "$API_KEY" ]; then
                echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
                export ANTHROPIC_API_KEY="$API_KEY"
                echo "✓ API key saved to ~/.bashrc"
            fi
        fi
        echo ""
        echo "✅ Claude CLI installed! Run 'claude' to start."
        ;;
        
    3)
        echo "⏭️  Skipping AI CLI setup. Run this script again anytime:"
        echo "   bash .devcontainer/onboarding.sh"
        ;;
esac

# Step 2: GitHub CLI
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔐 GitHub CLI (Auditor)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if gh auth status &>/dev/null; then
    GH_USER=$(gh api user --jq '.login' 2>/dev/null)
    echo "✓ Already authenticated as: $GH_USER"
else
    echo ""
    echo "GitHub CLI is used for the Auditor workflow (code review, PRs)."
    echo ""
    if whiptail --title "GitHub Authentication" --yesno "Authenticate GitHub CLI now?\n\nThis opens a browser for secure login." 10 50; then
        gh auth login --web
    else
        echo "⏭️  Skipped. Run 'gh auth login' later."
    fi
fi

# Step 3: Git identity
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  👤 Git Identity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$(git config --global user.email)" ]; then
    if gh auth status &>/dev/null; then
        GH_USER=$(gh api user --jq '.login' 2>/dev/null)
        git config --global user.name "$GH_USER"
        git config --global user.email "${GH_USER}@users.noreply.github.com"
        echo "✓ Git identity set from GitHub: $GH_USER"
    else
        echo "⚠️  Git identity not set. Configure with:"
        echo "   git config --global user.name 'Your Name'"
        echo "   git config --global user.email 'you@example.com'"
    fi
else
    echo "✓ Git identity: $(git config --global user.name) <$(git config --global user.email)>"
fi

# Done!
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Onboarding Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🚀 Quick Start:"
echo "     gss              - Select workflow mode (Auditor/Rapid/Maintenance)"
echo "     gemini / claude  - Start your AI assistant"
echo "     gh pr create     - Create a pull request"
echo ""
echo "  📚 Documentation:"
echo "     README.md        - Project overview"
echo "     CONTRIBUTING.md  - How to contribute"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
