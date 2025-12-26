#!/bin/bash
# Create a desktop shortcut for CVstomize dev container
# Usage: ./scripts/create-shortcut.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="CVstomize"

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)  echo "macos" ;;
        Linux*)
            if grep -q Microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            else
                echo "linux"
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)        echo "unknown" ;;
    esac
}

OS=$(detect_os)

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🖥️  Create Desktop Shortcut for ${PROJECT_NAME}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Detected OS: ${CYAN}${OS}${NC}"
echo -e "Project: ${CYAN}${PROJECT_DIR}${NC}"
echo ""

create_macos_shortcut() {
    DESKTOP="$HOME/Desktop"
    APP_PATH="$DESKTOP/${PROJECT_NAME}.app"

    echo -e "${CYAN}Creating macOS application...${NC}"

    # Create .app bundle structure
    mkdir -p "$APP_PATH/Contents/MacOS"
    mkdir -p "$APP_PATH/Contents/Resources"

    # Create the launcher script
    cat > "$APP_PATH/Contents/MacOS/${PROJECT_NAME}" << LAUNCHER
#!/bin/bash
# Launch CVstomize Dev Container

PROJECT_DIR="${PROJECT_DIR}"

# Start Docker Desktop if not running
if ! docker info &>/dev/null; then
    open -a Docker
    echo "Starting Docker Desktop..."
    while ! docker info &>/dev/null; do
        sleep 2
    done
    echo "Docker is ready!"
fi

# Open in VS Code Dev Container
code --folder-uri "vscode-remote://dev-container+$(echo -n "$PROJECT_DIR" | xxd -p | tr -d '\n')/workspaces/cvstomize"

# Fallback: just open the folder if remote URI fails
if [ \$? -ne 0 ]; then
    cd "\$PROJECT_DIR"
    code .
fi
LAUNCHER
    chmod +x "$APP_PATH/Contents/MacOS/${PROJECT_NAME}"

    # Create Info.plist
    cat > "$APP_PATH/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${PROJECT_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.cvstomize.devcontainer</string>
    <key>CFBundleName</key>
    <string>${PROJECT_NAME}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
PLIST

    # Create a simple icon (optional - uses default)
    echo -e "${GREEN}✅ Created: ${APP_PATH}${NC}"
    echo ""
    echo -e "${CYAN}Double-click the app on your Desktop to launch!${NC}"
}

create_windows_shortcut() {
    # For WSL, create shortcut in Windows Desktop
    WIN_DESKTOP="/mnt/c/Users/$USER/Desktop"

    # Try to find actual Windows username
    if [ -d "/mnt/c/Users" ]; then
        # Get the most likely Windows user folder
        WIN_USER=$(ls /mnt/c/Users | grep -v -E "^(Public|Default|Default User|All Users)$" | head -1)
        if [ -n "$WIN_USER" ]; then
            WIN_DESKTOP="/mnt/c/Users/$WIN_USER/Desktop"
        fi
    fi

    if [ ! -d "$WIN_DESKTOP" ]; then
        echo -e "${YELLOW}Could not find Windows Desktop folder.${NC}"
        echo -e "Tried: $WIN_DESKTOP"
        echo ""
        echo -e "${CYAN}Manual setup:${NC}"
        echo "1. Right-click on Desktop → New → Shortcut"
        echo "2. Location: wsl.exe --cd \"${PROJECT_DIR}\" code ."
        echo "3. Name: ${PROJECT_NAME}"
        return
    fi

    SHORTCUT_PATH="$WIN_DESKTOP/${PROJECT_NAME}.bat"

    echo -e "${CYAN}Creating Windows shortcut...${NC}"

    # Convert WSL path to Windows path
    WIN_PROJECT_PATH=$(wslpath -w "$PROJECT_DIR" 2>/dev/null || echo "")

    if [ -n "$WIN_PROJECT_PATH" ]; then
        cat > "$SHORTCUT_PATH" << BATCH
@echo off
:: Launch CVstomize Dev Container

:: Start Docker Desktop if not running
docker info >nul 2>&1
if errorlevel 1 (
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :wait_docker
    timeout /t 2 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto wait_docker
    echo Docker is ready!
)

:: Open in VS Code
cd /d "${WIN_PROJECT_PATH}"
code .
BATCH
        echo -e "${GREEN}✅ Created: ${SHORTCUT_PATH}${NC}"
    else
        # Fallback for pure WSL approach
        cat > "$SHORTCUT_PATH" << BATCH
@echo off
:: Launch CVstomize Dev Container via WSL
wsl.exe --cd "${PROJECT_DIR}" bash -c "code ."
BATCH
        echo -e "${GREEN}✅ Created: ${SHORTCUT_PATH}${NC}"
    fi

    echo ""
    echo -e "${CYAN}Double-click ${PROJECT_NAME}.bat on your Desktop to launch!${NC}"
}

create_linux_shortcut() {
    DESKTOP="$HOME/Desktop"

    # Also try XDG desktop directory
    if [ -f "$HOME/.config/user-dirs.dirs" ]; then
        source "$HOME/.config/user-dirs.dirs"
        DESKTOP="${XDG_DESKTOP_DIR:-$HOME/Desktop}"
    fi

    mkdir -p "$DESKTOP"

    SHORTCUT_PATH="$DESKTOP/${PROJECT_NAME}.desktop"

    echo -e "${CYAN}Creating Linux .desktop entry...${NC}"

    cat > "$SHORTCUT_PATH" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=${PROJECT_NAME}
Comment=Launch CVstomize Dev Container
Exec=bash -c 'if ! docker info &>/dev/null; then systemctl --user start docker 2>/dev/null || sudo systemctl start docker; sleep 3; fi; code "${PROJECT_DIR}"'
Icon=docker
Terminal=false
Categories=Development;
StartupWMClass=Code
DESKTOP

    chmod +x "$SHORTCUT_PATH"

    # Also add to applications menu
    APPS_DIR="$HOME/.local/share/applications"
    mkdir -p "$APPS_DIR"
    cp "$SHORTCUT_PATH" "$APPS_DIR/"

    echo -e "${GREEN}✅ Created: ${SHORTCUT_PATH}${NC}"
    echo -e "${GREEN}✅ Added to Applications menu${NC}"
    echo ""
    echo -e "${CYAN}Double-click the shortcut on your Desktop to launch!${NC}"
    echo -e "${YELLOW}Note: You may need to right-click → 'Allow Launching' first${NC}"
}

# Main
case "$OS" in
    macos)
        create_macos_shortcut
        ;;
    wsl)
        create_windows_shortcut
        ;;
    windows)
        create_windows_shortcut
        ;;
    linux)
        create_linux_shortcut
        ;;
    *)
        echo -e "${RED}Unknown OS. Cannot create shortcut automatically.${NC}"
        echo ""
        echo -e "${CYAN}Manual option:${NC}"
        echo "Create a shortcut/alias that runs: code ${PROJECT_DIR}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Shortcut created!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
