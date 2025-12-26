#!/bin/bash
# CVstomize - Toggle Start/Stop
# Double-click this to start or stop the dev environment

cd "$(dirname "$0")"

# Check if containers are running
if docker compose ps --status running 2>/dev/null | grep -q "cvstomize"; then
    echo "🛑 Stopping CVstomize..."
    docker compose down
    echo "✅ Stopped!"
else
    echo "🚀 Starting CVstomize..."
    docker compose up -d
    echo ""
    echo "✅ Started!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔌 Backend:  http://localhost:3001"
    echo ""
fi

# Keep window open on Windows
read -p "Press Enter to close..."
