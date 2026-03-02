#!/bin/bash
# Session Selector - Choose workflow mode
# Builder: Gemini/Claude CLI | Auditor: GitHub Copilot

if ! command -v whiptail &> /dev/null; then
    echo "⚠️  whiptail not installed. Run: sudo apt-get install whiptail"
    return 2>/dev/null || exit 1
fi

# Only run in interactive shells
if [[ $- != *i* ]] && [[ -z "$FORCE_SESSION_SELECT" ]]; then
    return 2>/dev/null || exit 0
fi

CURRENT_DIR=$(pwd)

CHOICE=$(whiptail --title "🚀 AI Dev Workflow: Session Mode" \
--menu "Builder: Gemini/Claude CLI  •  Auditor: GitHub Copilot\n\nWorking in: $CURRENT_DIR\n\nSelect workflow:" 18 70 3 \
"1" "Builder + Auditor   (🛡️ Pre-commit checks enabled)" \
"2" "Rapid Prototyping   (⚡ Skip auditor, fast iteration)" \
"3" "Maintenance         (🛠️  Manual mode, no automation)" \
3>&1 1>&2 2>&3)

EXIT_STATUS=$?

if [ $EXIT_STATUS -eq 0 ]; then
    case $CHOICE in
        1)
            export SKIP_AUDITOR=false
            echo ""
            echo "🛡️  [Mode] Builder + Auditor"
            echo "   • Pre-commit: Pattern checks (security, console.log, etc.)"
            echo "   • PR Review:  GitHub Copilot full review"
            echo "   • Builder:    gemini / claude"
            echo ""
            ;;
        2)
            export SKIP_AUDITOR=true
            echo ""
            echo "⚡ [Mode] Rapid Prototyping"
            echo "   • Pre-commit: Skipped"
            echo "   • PR Review:  GitHub Copilot still reviews"
            echo "   • Builder:    gemini / claude"
            echo ""
            ;;
        3)
            export SKIP_AUDITOR=true
            echo ""
            echo "🛠️  [Mode] Maintenance"
            echo "   • No automation - manual commits"
            echo ""
            ;;
    esac
else
    export SKIP_AUDITOR=false
    echo "🛡️  [Mode] Builder + Auditor (default)"
fi
