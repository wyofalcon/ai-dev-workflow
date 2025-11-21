#!/bin/bash

# Start the local development environment using Docker Compose
echo "Starting local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check for GCP credentials
if [ ! -f "gcp-key.json" ]; then
  echo "Warning: gcp-key.json not found in the root directory."
  echo "Vertex AI features may not work without credentials."
  echo "If you have a key file, place it in the root directory as 'gcp-key.json'."
  # Check if it exists in api/
  if [ -f "api/cvstomize-deployer-key.json" ]; then
      echo "Found api/cvstomize-deployer-key.json. Copying to ./gcp-key.json..."
      cp api/cvstomize-deployer-key.json ./gcp-key.json
  fi
fi

# Build and start containers
docker-compose -f docker-compose.yml up --build -d

echo "Local environment started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Database: localhost:5432"
echo "Redis: localhost:6379"
echo "To view logs: docker-compose -f docker-compose.yml logs -f"
