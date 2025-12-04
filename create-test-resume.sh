#!/bin/bash

# Create a test resume for claude.test.20250403@example.com
# This is needed to enable the Gold Standard button

API_URL="https://cvstomize-api-351889420459.us-central1.run.app/api"

echo "🔐 You need to provide a Firebase auth token for claude.test.20250403@example.com"
echo ""
echo "To get the token:"
echo "1. Open Chrome DevTools (F12)"
echo "2. Go to Application > Local Storage > https://cvstomize-frontend..."
echo "3. Find the Firebase auth token"
echo ""
echo "Or sign in and run this in console:"
echo "  firebase.auth().currentUser.getIdToken().then(token => console.log(token))"
echo ""
read -p "Paste Firebase token: " FIREBASE_TOKEN

if [ -z "$FIREBASE_TOKEN" ]; then
  echo "❌ No token provided"
  exit 1
fi

echo ""
echo "📝 Creating test resume..."

RESPONSE=$(curl -s -X POST "${API_URL}/resume/build-new" \
  -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPosting": "Software Engineer position requiring Python and React experience. Build scalable web applications.",
    "selectedSections": ["Summary", "Experience", "Skills", "Education"],
    "personalInfo": {
      "fullName": "Test User",
      "email": "claude.test.20250403@example.com",
      "phone": "(555) 123-4567",
      "location": "San Francisco, CA"
    }
  }')

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.resume.id' > /dev/null 2>&1; then
  RESUME_ID=$(echo "$RESPONSE" | jq -r '.resume.id')
  echo ""
  echo "✅ Resume created successfully!"
  echo "📄 Resume ID: $RESUME_ID"
  echo "🔗 View at: https://cvstomize-frontend-351889420459.us-central1.run.app/resume/$RESUME_ID"
else
  echo ""
  echo "❌ Resume creation failed"
  exit 1
fi
