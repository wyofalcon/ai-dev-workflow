#!/bin/bash
# Reconnect MCP servers for Gemini CLI on container start
# This script pre-warms MCP servers to avoid first-connection delays

# Silent exit if Gemini not configured
if ! command -v gemini &> /dev/null; then
    exit 0
fi

# Check if Gemini has been authenticated
if [ ! -f ~/.gemini/settings.json ] && [ ! -f ~/.gemini/oauth_creds.json ]; then
    exit 0
fi

echo "🔌 Pre-warming MCP servers for faster Gemini startup..."

# Pre-install MCP server packages in background to speed up first connection
# This runs npx to cache the packages without starting actual servers
{
    npx -y @upstash/context7-mcp --version 2>/dev/null &
    npx -y @modelcontextprotocol/server-github --version 2>/dev/null &
    npx -y @playwright/mcp@latest --version 2>/dev/null &
    npx -y @modelcontextprotocol/server-sequential-thinking --version 2>/dev/null &
    npx -y @modelcontextprotocol/server-memory --version 2>/dev/null &
    npx -y @anthropic-ai/mcp-server-filesystem --version 2>/dev/null &
    npx -y @anthropic-ai/mcp-server-fetch --version 2>/dev/null &
    npx -y @anthropic-ai/mcp-server-git --version 2>/dev/null &
    wait
} &

echo "✅ MCP servers pre-warming in background (will be ready when Gemini starts)"
