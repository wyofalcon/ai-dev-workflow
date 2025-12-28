#!/bin/bash
# Builder Setup - Welcomes user and helps them choose their AI CLI and DevEnv
# Shows reassuring messages during container initialization

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTEXT_DIR="$PROJECT_ROOT/.context"
FIRST_TIME_MARKER="$HOME/.ai_workflow_welcomed"
DEVQUICK_DIR="$HOME/.devquick-presets"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Wait for whiptail to be available (may still be installing)
wait_for_whiptail() {
    for i in {1..10}; do
        if command -v whiptail &> /dev/null; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# Show first-time welcome popup
show_first_time_popup() {
    if [ ! -f "$FIRST_TIME_MARKER" ] && wait_for_whiptail; then
        whiptail --title "🎉 Welcome to CVstomize!" --msgbox "$(cat << 'EOF'
Welcome! This dev container uses a Builder/Auditor workflow:

📝 HOW IT WORKS:
   1. Describe your idea to Copilot (Auditor)
   2. Copilot refines it into a Builder prompt
   3. Review the prompt, then send to Builder
   4. Builder (Gemini/Claude) implements it

🤖 BUILDER: Gemini or Claude CLI (generates code)
🔍 AUDITOR: GitHub Copilot (reviews & refines)

🌍 DEV ENVIRONMENTS:
   • DevLocal: Mock services (free, no costs)
   • DevLive: Real services (isolated from prod)
   • DevHybrid: Mix and match services

📋 NEXT STEPS:
   1. Choose your development environment
   2. Set up your AI Builder
   3. (Optional) Save as DevQuick preset

Press OK to continue...
EOF
)" 26 65

        # Offer to create desktop shortcut
        if whiptail --title "🖥️ Desktop Shortcut" --yesno "Would you like to create a Desktop shortcut to quickly reopen this project?\n\nThis creates a clickable icon that:\n  • Starts Docker if needed\n  • Opens VS Code with this dev container\n  • Works even after restart" 14 60; then
            # Run the shortcut creator
            if [ -f "/workspaces/cvstomize/scripts/create-shortcut.sh" ]; then
                bash /workspaces/cvstomize/scripts/create-shortcut.sh
            else
                whiptail --title "⚠️ Script Not Found" --msgbox "Shortcut script not found.\n\nYou can run it manually later:\n  ./scripts/create-shortcut.sh" 10 50
            fi
        fi

        touch "$FIRST_TIME_MARKER"
    fi
}

clear

# Show first-time popup before anything else
show_first_time_popup

# Show welcome banner
echo -e "${BLUE}"
cat << 'BANNER'
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║     ██████╗██╗   ██╗███████╗████████╗ ██████╗ ███╗   ███╗    ║
   ║    ██╔════╝██║   ██║██╔════╝╚══██╔══╝██╔═══██╗████╗ ████║    ║
   ║    ██║     ██║   ██║███████╗   ██║   ██║   ██║██╔████╔██║    ║
   ║    ██║     ╚██╗ ██╔╝╚════██║   ██║   ██║   ██║██║╚██╔╝██║    ║
   ║    ╚██████╗ ╚████╔╝ ███████║   ██║   ╚██████╔╝██║ ╚═╝ ██║    ║
   ║     ╚═════╝  ╚═══╝  ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝    ║
   ║                                                               ║
   ╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

echo -e "${CYAN}${BOLD}   🎉 Welcome to CVstomize!${NC}"
echo ""
echo -e "   ${DIM}This is a personality-aware resume builder powered by AI.${NC}"
echo -e "   ${DIM}We use a Builder/Auditor workflow for quality code.${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${BOLD}How it works:${NC}"
echo ""
echo -e "   ${GREEN}🤖 Builder${NC}    Your AI coding assistant (Gemini or Claude CLI)"
echo -e "                Generates code, answers questions, helps you build"
echo ""
echo -e "   ${GREEN}🔍 Auditor${NC}    GitHub Copilot (this chat) + automated checks"
echo -e "                Reviews code, catches bugs, ensures quality"
echo ""
echo -e "   ${GREEN}🌍 DevEnv${NC}     Choose your development environment mode"
echo -e "                Local (mock) • Live (real) • Hybrid (mixed)"
echo ""
echo -e "   ${GREEN}📁 Workflow${NC}   Builder writes → Auditor reviews → You ship!"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${YELLOW}⏳ Preparing setup wizard...${NC}"
echo ""

# Brief pause for visual effect
sleep 2

# Check if whiptail is available
if ! command -v whiptail &> /dev/null; then
    echo -e "   ${YELLOW}📦 Installing UI components...${NC}"
    # Wait for apt lock
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        sleep 1
    done
    sudo apt-get update -qq && sudo apt-get install -y -qq whiptail > /dev/null 2>&1
fi

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Development Environment Selection (runs every time)
# ═══════════════════════════════════════════════════════════════════════════

show_devenv_selection() {
    # Check for DevQuick presets
    local HAS_PRESETS=false
    if [ -d "$DEVQUICK_DIR" ] && [ "$(ls -A "$DEVQUICK_DIR" 2>/dev/null)" ]; then
        HAS_PRESETS=true
    fi

    # Build menu options
    local MENU_OPTIONS=(
        "DevLocal" "🏠 Mock services - zero cost, fully local"
        "DevLive" "🌐 Real dev services - isolated from production"
        "DevHybrid" "🔀 Mix and match - configure per service"
    )

    if [ "$HAS_PRESETS" = true ]; then
        MENU_OPTIONS+=("DevQuick" "⚡ Load a saved configuration preset")
    fi

    local DEVENV_CHOICE
    DEVENV_CHOICE=$(whiptail --title "🌍 Choose Development Environment" \
        --menu "\nSelect your development environment for this session:\n\n• DevLocal: Mock services (free, no external API calls)\n• DevLive: Real services (isolated from production)\n• DevHybrid: Mix mock and live services\n" \
        22 75 4 "${MENU_OPTIONS[@]}" 3>&1 1>&2 2>&3)

    if [ $? -ne 0 ]; then
        echo "DevLocal"  # Default
        return
    fi

    echo "$DEVENV_CHOICE"
}

configure_hybrid_services() {
    # Let user configure which services are mock vs live
    local services=("database" "cache" "storage" "email" "payment" "auth" "ai" "analytics")
    local config=""

    for service in "${services[@]}"; do
        local choice
        choice=$(whiptail --title "🔀 Configure $service" \
            --menu "Use mock or live $service?" 12 50 2 \
            "mock" "🏠 Mock (free, local)" \
            "live" "🌐 Live (real service)" \
            3>&1 1>&2 2>&3)

        if [ $? -eq 0 ]; then
            config="${config}${service}:${choice},"
        else
            config="${config}${service}:mock,"
        fi
    done

    echo "$config"
}

load_devquick_preset() {
    # List available presets
    local presets=()
    for preset_file in "$DEVQUICK_DIR"/*.json; do
        if [ -f "$preset_file" ]; then
            local name
            name=$(basename "$preset_file" .json)
            local desc
            desc=$(python3 -c "import json; print(json.load(open('$preset_file')).get('description', 'No description')[:40])" 2>/dev/null || echo "Saved preset")
            presets+=("$name" "$desc")
        fi
    done

    if [ ${#presets[@]} -eq 0 ]; then
        whiptail --title "⚡ DevQuick" --msgbox "No presets found.\n\nSave one after configuring your environment." 10 50
        return 1
    fi

    local choice
    choice=$(whiptail --title "⚡ Load DevQuick Preset" \
        --menu "Select a saved configuration:" 18 60 6 "${presets[@]}" 3>&1 1>&2 2>&3)

    if [ $? -eq 0 ] && [ -n "$choice" ]; then
        echo "$choice"
        return 0
    fi
    return 1
}

apply_devenv() {
    local env_name="$1"
    local hybrid_config="$2"

    mkdir -p "$CONTEXT_DIR"
    echo "$env_name" > "$CONTEXT_DIR/ACTIVE_DEVENV"

    # Create active config JSON
    local timestamp
    timestamp=$(date -Iseconds)

    case "$env_name" in
        DevLocal)
            cat > "$CONTEXT_DIR/active-devenv.json" << EOF
{
  "environment": "DevLocal",
  "icon": "🏠",
  "isolation": "complete",
  "costRisk": "none",
  "timestamp": "$timestamp",
  "services": {
    "database": {"type": "mock"},
    "cache": {"type": "mock"},
    "storage": {"type": "mock"},
    "email": {"type": "mock"},
    "payment": {"type": "mock"},
    "auth": {"type": "mock"},
    "ai": {"type": "mock"},
    "analytics": {"type": "mock"}
  }
}
EOF
            ;;
        DevLive)
            cat > "$CONTEXT_DIR/active-devenv.json" << EOF
{
  "environment": "DevLive",
  "icon": "🌐",
  "isolation": "dev-namespace",
  "costRisk": "low",
  "timestamp": "$timestamp",
  "services": {
    "database": {"type": "live", "environment": "development"},
    "cache": {"type": "live", "environment": "development"},
    "storage": {"type": "live", "environment": "development"},
    "email": {"type": "live", "environment": "development"},
    "payment": {"type": "live", "environment": "development", "testMode": true},
    "auth": {"type": "live", "environment": "development"},
    "ai": {"type": "live", "environment": "development"},
    "analytics": {"type": "live", "environment": "development"}
  }
}
EOF
            ;;
        DevHybrid)
            # Parse hybrid config and create JSON
            python3 "$PROJECT_ROOT/scripts/devenv-manager.py" --set DevHybrid
            ;;
    esac

    # Generate environment file
    cat > "$CONTEXT_DIR/devenv.env" << EOF
# Auto-generated DevEnv configuration
# Environment: $env_name
# Generated: $timestamp

DEVENV_MODE=$env_name
EOF
}

# Check if there's already an active DevEnv from last session
LAST_DEVENV=$(cat "$CONTEXT_DIR/ACTIVE_DEVENV" 2>/dev/null || echo "")
SKIP_SELECTION=false

if [ -n "$LAST_DEVENV" ] && [ -f "$CONTEXT_DIR/active-devenv.json" ]; then
    # Returning user - ask if they want to keep last config
    if wait_for_whiptail; then
        KEEP_LAST=$(whiptail --title "🔄 Welcome Back!" \
            --menu "\nYour last session used: $LAST_DEVENV\n\nWhat would you like to do?\n" \
            16 65 3 \
            "keep" "✅ Keep $LAST_DEVENV (quick start)" \
            "change" "🔄 Choose a different environment" \
            "preset" "⚡ Load a DevQuick preset" \
            3>&1 1>&2 2>&3)

        case "$KEEP_LAST" in
            keep)
                DEVENV_CHOICE="$LAST_DEVENV"
                SKIP_SELECTION=true
                ;;
            preset)
                DEVENV_CHOICE="DevQuick"
                ;;
            *)
                DEVENV_CHOICE=""
                ;;
        esac
    fi
fi

# Show DevEnv selection (if not skipped)
if [ "$SKIP_SELECTION" = false ]; then
    if [ -z "$DEVENV_CHOICE" ]; then
        echo -e "   ${CYAN}🌍 Selecting development environment...${NC}"
        DEVENV_CHOICE=$(show_devenv_selection)
    fi
fi

case "$DEVENV_CHOICE" in
    DevQuick)
        PRESET_NAME=$(load_devquick_preset)
        if [ $? -eq 0 ] && [ -n "$PRESET_NAME" ]; then
            python3 "$PROJECT_ROOT/scripts/devquick-manager.py" --load "$PRESET_NAME"
            DEVENV_CHOICE=$(cat "$CONTEXT_DIR/ACTIVE_DEVENV" 2>/dev/null || echo "DevLocal")
        else
            DEVENV_CHOICE="DevLocal"
            apply_devenv "$DEVENV_CHOICE"
        fi
        ;;
    DevHybrid)
        HYBRID_CONFIG=$(configure_hybrid_services)
        apply_devenv "$DEVENV_CHOICE" "$HYBRID_CONFIG"
        ;;
    *)
        apply_devenv "$DEVENV_CHOICE"
        ;;
esac

echo ""
echo -e "   ${GREEN}✓ Environment: ${BOLD}$DEVENV_CHOICE${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: AI Builder Configuration (check if already configured)
# ═══════════════════════════════════════════════════════════════════════════

# Check if already configured
GEMINI_CONFIGURED=false
CLAUDE_CONFIGURED=false

if [ -f ~/.gemini/settings.json ]; then
    GEMINI_CONFIGURED=true
fi
if [ -n "$ANTHROPIC_API_KEY" ]; then
    CLAUDE_CONFIGURED=true
fi

# If already configured, show quick summary and exit
if [ "$GEMINI_CONFIGURED" = true ] || [ "$CLAUDE_CONFIGURED" = true ]; then
    clear
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ Development Environment Ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Show DevEnv status
    ACTIVE_ENV=$(cat "$CONTEXT_DIR/ACTIVE_DEVENV" 2>/dev/null || echo "DevLocal")
    case "$ACTIVE_ENV" in
        DevLocal) ENV_ICON="🏠" ;;
        DevLive) ENV_ICON="🌐" ;;
        DevHybrid) ENV_ICON="🔀" ;;
        *) ENV_ICON="🌍" ;;
    esac
    echo -e "  ${BOLD}Environment:${NC}"
    echo -e "    ${CYAN}•${NC} ${ENV_ICON} ${GREEN}${ACTIVE_ENV}${NC}"
    echo ""

    echo -e "  ${BOLD}Your AI Builder:${NC}"
    if [ "$GEMINI_CONFIGURED" = true ]; then
        echo -e "    ${CYAN}•${NC} Gemini CLI - run ${GREEN}gemini${NC} to start"
    fi
    if [ "$CLAUDE_CONFIGURED" = true ]; then
        echo -e "    ${CYAN}•${NC} Claude CLI - run ${GREEN}claude${NC} to start"
    fi
    echo ""
    echo -e "  ${BOLD}Auditor:${NC}"
    echo -e "    ${CYAN}•${NC} GitHub Copilot (this chat + PR reviews)"
    echo ""
    echo -e "  ${BOLD}Commands:${NC}"
    echo -e "    ${CYAN}devenv${NC}  - Change development environment"
    echo -e "    ${CYAN}dq${NC}      - DevQuick preset manager"
    echo -e "    ${CYAN}creds${NC}   - Manage credentials"
    echo -e "    ${CYAN}gemini${NC}  - Start Gemini CLI"
    echo -e "    ${CYAN}claude${NC}  - Start Claude CLI"
    echo ""

    # Offer to save as DevQuick preset
    if whiptail --title "⚡ Save as DevQuick?" --yesno "Save this configuration as a DevQuick preset?\n\nThis lets you quickly restore your:\n  • Development environment ($ACTIVE_ENV)\n  • AI Builder settings\n  • Workflow preferences" 14 60; then
        python3 "$PROJECT_ROOT/scripts/devquick-manager.py" --save
    fi

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 0
fi

# Show Builder selection GUI
AI_CHOICE=$(whiptail --title "🤖 Choose Your AI Builder" \
--menu "\nThe Builder generates code, the Auditor (GitHub Copilot) reviews it.\n\nWhich AI CLI do you want as your Builder?" 18 65 3 \
"gemini" "Gemini CLI  ⭐ (Google account / API key)" \
"claude" "Claude CLI     (Anthropic API key required)" \
"skip" "Skip for now   (set up later)" \
3>&1 1>&2 2>&3)

# Handle cancel
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}Setup cancelled. Run 'bash .devcontainer/onboarding.sh' anytime.${NC}"
    exit 0
fi

case $AI_CHOICE in
    gemini)
        echo ""
        echo -e "${CYAN}📦 Setting up Gemini CLI...${NC}"

        if ! command -v gemini &> /dev/null; then
            unset NODE_OPTIONS
            npm install -g @google/gemini-cli 2>/dev/null || true
        fi

        # Ask for auth method
        AUTH_CHOICE=$(whiptail --title "Gemini Authentication" \
        --menu "\nHow do you want to authenticate?\n" 14 65 2 \
        "oauth" "Google Account - best for Gemini Advanced/Ultra" \
        "apikey" "API Key - free tier from aistudio.google.com" \
        3>&1 1>&2 2>&3)

        mkdir -p ~/.gemini
        if [ "$AUTH_CHOICE" = "oauth" ]; then
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "oauth"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            # Set preference
            echo "gemini" > ~/.ai-cli-preference

            whiptail --title "✅ Gemini CLI Ready" --msgbox "\
Gemini CLI is configured for Google Account login.\n\n\
When the AI Builder terminal opens, it will prompt you\n\
to authenticate with your Google account.\n\n\
If you have Gemini Advanced/Ultra, you'll get those perks!" 14 60
        else
            cat > ~/.gemini/settings.json << 'SETTINGS'
{
  "ide": {"hasSeenNudge": true, "enabled": true},
  "security": {"auth": {"selectedType": "gemini-api-key"}},
  "general": {"previewFeatures": true}
}
SETTINGS
            # Set preference
            echo "gemini" > ~/.ai-cli-preference

            whiptail --title "✅ Gemini CLI Ready" --msgbox "\
Gemini CLI is configured for API Key authentication.\n\n\
To get your free API key:\n\
  1. Go to: https://aistudio.google.com/app/apikey\n\
  2. Create a new API key\n\
  3. Paste it when the AI Builder terminal prompts you" 14 65
        fi
        ;;

    claude)
        echo ""
        echo -e "${CYAN}📦 Setting up Claude CLI...${NC}"

        if ! command -v claude &> /dev/null; then
            unset NODE_OPTIONS
            npm install -g @anthropic-ai/claude-code 2>/dev/null || true
        fi

        # Get API key
        API_KEY=$(whiptail --title "Claude API Key" \
        --passwordbox "\nEnter your Anthropic API key:\n\n(Get one at: console.anthropic.com/settings/keys)" 12 65 \
        3>&1 1>&2 2>&3)

        if [ -n "$API_KEY" ]; then
            # Add to bashrc
            echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc
            export ANTHROPIC_API_KEY="$API_KEY"

            # Set preference
            echo "claude" > ~/.ai-cli-preference

            whiptail --title "✅ Claude CLI Ready" --msgbox "\
Claude CLI is configured and ready to use!\n\n\
The AI Builder terminal will start Claude automatically." 10 60
        else
            whiptail --title "⚠️ No API Key" --msgbox "\
No API key provided. You can set it later:\n\n\
  export ANTHROPIC_API_KEY=your-key\n\n\
Or run: bash .devcontainer/onboarding.sh" 12 55
        fi
        ;;

    skip)
        whiptail --title "Setup Skipped" --msgbox "\
No problem! You can set up your AI Builder anytime:\n\n\
  bash .devcontainer/onboarding.sh\n\n\
Or install directly:\n\
  • Gemini: npm i -g @google/gemini-cli && gemini\n\
  • Claude: npm i -g @anthropic-ai/claude-code" 14 60
        ;;
esac

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Code Style Detection (automatic for existing projects)
# ═══════════════════════════════════════════════════════════════════════════

STYLE_CONFIG="$CONTEXT_DIR/code-style.json"
STYLE_TRACKER="$PROJECT_ROOT/scripts/style-tracker.py"

# Check if this is an existing project with code (not just the workflow files)
has_existing_code() {
    local code_files
    code_files=$(find "$PROJECT_ROOT" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.go" -o -name "*.rs" \) \
        ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/scripts/*" 2>/dev/null | head -5)
    [ -n "$code_files" ]
}

# Only scan if styles not already detected AND there's existing code
if [ ! -f "$STYLE_CONFIG" ] && [ -f "$STYLE_TRACKER" ] && has_existing_code; then
    echo ""
    echo -e "${CYAN}📐 Scanning existing code for style patterns...${NC}"
    python3 "$STYLE_TRACKER" --scan --quiet 2>/dev/null || true

    if [ -f "$STYLE_CONFIG" ]; then
        echo -e "${GREEN}   ✅ Code styles detected and saved${NC}"

        # Generate Builder/Auditor rules
        CONTEXT_GEN="$PROJECT_ROOT/scripts/generate-context.py"
        if [ -f "$CONTEXT_GEN" ]; then
            python3 "$CONTEXT_GEN" --update 2>/dev/null || true
            echo -e "${GREEN}   ✅ Builder & Auditor rules generated${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}⏳ Launching split terminals...${NC}"
echo ""

# Give VS Code a moment to finish, then close this terminal
sleep 1
