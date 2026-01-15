#!/bin/bash

# start-design-mode.sh
# Starts the frontend in "Design-First" mode using mock data.
# This allows UX development without a running backend.

echo "🎨 Starting CVstomize in Design-First Mode..."
echo "🔌 Backend calls will be intercepted and served with MOCK DATA."

export REACT_APP_USE_MOCK_DATA=true

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ Error: npm is not installed."
    exit 1
fi

# Start the app on a different port to avoid conflicts
export PORT=3001
export BROWSER=none

# Start the app
npm start
