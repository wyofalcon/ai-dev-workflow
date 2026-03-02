#!/bin/bash

# ==============================================================================
# WORKSPACE SELECTOR
# ==============================================================================
# Displays a popup menu to select the active development workflow.
# Must be sourced to affect the current shell: source scripts/workspace-selector.sh
# ==============================================================================

# Check for whiptail
if ! command -v whiptail &> /dev/null;
then
    echo "⚠️  'whiptail' not found. Defaulting to Auditor Mode."
    export SKIP_AUDITOR=false
    return
fi

# Display Menu
CHOICE=$(whiptail --title "🚀 AI Dev Workflow - Environment Selector" \
--menu "Select your workflow for this session:" 16 78 4 \
"1" "Builder + 2 Auditors  (🛡️ Strict: Copilot CLI blocks bad commits)" \
"2" "Rapid Prototyping     (⚡ Fast: No blocking audits)" \
"3" "Maintenance           (🛠️  Manual: No AI enforcement)" 
3>&1 1>&2 2>&3)

EXIT_STATUS=$?

if [ $EXIT_STATUS -eq 0 ];
then
    case $CHOICE in
        1)
            echo ""
            echo "🛡️  [Active] Builder + 2 Auditors"
            echo "   - Auditor 1 (Copilot CLI): ON (Blocking)"
            echo "   - Auditor 2 (Copilot Chat): ON (Escalation)"
            export SKIP_AUDITOR=false
            
            # Auto-install if missing
            if [ ! -f ".git/hooks/pre-commit" ] && [ -f "scripts/install-auditor-workflow.sh" ];
then
                echo "   ... Installing hooks ..."
                ./scripts/install-auditor-workflow.sh > /dev/null
            fi
            ;;
        2)
            echo ""
            echo "⚡ [Active] Rapid Prototyping"
            echo "   - Auditor 1 (Local): OFF"
            echo "   - Auditor 2 (Claude): Available"
            export SKIP_AUDITOR=true
            ;;
        3)
            echo ""
            echo "🛠️  [Active] Maintenance Mode"
            echo "   - Auditor 1 (Local): OFF"
            export SKIP_AUDITOR=true
            ;;
    esac
else
    echo ""
    echo "❌ Selection cancelled. Defaulting to Strict Mode."
    export SKIP_AUDITOR=false
fi
