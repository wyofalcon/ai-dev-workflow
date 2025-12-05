#!/bin/bash
# Get Firebase Web API Key from frontend config
API_KEY=$(grep REACT_APP_FIREBASE_API_KEY .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$API_KEY" ]; then
  echo "❌ Could not find Firebase API key in .env file"
  exit 1
fi

EMAIL="claude.test.20250403@example.com"

echo "🔑 Sending password reset email to: $EMAIL"

# Use Firebase REST API to send password reset email
curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"requestType\":\"PASSWORD_RESET\",\"email\":\"$EMAIL\"}" | jq '.'

echo ""
echo "✅ If successful, check the email inbox for password reset link"
