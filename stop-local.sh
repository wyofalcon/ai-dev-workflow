#!/bin/bash

# Stop the local development environment
echo "Stopping local development environment..."

docker-compose -f docker-compose.yml down

echo "Local environment stopped."
