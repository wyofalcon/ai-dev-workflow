#!/bin/bash
# Setup MCP servers for Gemini CLI
# This script configures MCP servers that persist across container restarts

echo "🔌 Setting up Gemini CLI MCP servers..."

# Ensure Gemini CLI is installed
if ! command -v gemini &> /dev/null; then
    echo "⚠️  Gemini CLI not installed. Skipping MCP setup."
    exit 0
fi

# Function to add MCP server if not already configured
add_mcp_server() {
    local name="$1"
    shift
    local command="$@"

    # Check if server already exists
    if gemini mcp list 2>/dev/null | grep -q "^✓ $name:\|^✗ $name:"; then
        echo "   ⏭️  $name already configured"
    else
        echo "   ➕ Adding $name..."
        gemini mcp add "$name" $command 2>/dev/null || echo "   ⚠️  Failed to add $name"
    fi
}

# Add MCP servers (these are stdio servers that run via npx)
echo "📡 Configuring MCP servers..."

# Context7 - Library documentation
add_mcp_server "context7" npx -y @upstash/context7-mcp

# GitHub - Repository operations
add_mcp_server "github" npx -y @modelcontextprotocol/server-github

# Playwright - Browser automation
add_mcp_server "playwright" npx -y @playwright/mcp@latest

# Sequential Thinking - Structured problem solving
add_mcp_server "sequential-thinking" npx -y @modelcontextprotocol/server-sequential-thinking

# Memory - Persistent memory
add_mcp_server "memory" npx -y @modelcontextprotocol/server-memory

# NOTE: The following Anthropic MCP servers don't exist on npm:
# - @anthropic-ai/mcp-server-filesystem (404)
# - @anthropic-ai/mcp-server-fetch (404)  
# - @anthropic-ai/mcp-server-git (404)
# If filesystem/git MCP servers become available, add them here.

echo ""
echo "📊 MCP Server Status:"
gemini mcp list 2>/dev/null || echo "Run 'gemini mcp list' to see status"
echo ""
echo "✅ MCP setup complete!"
