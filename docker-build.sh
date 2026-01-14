#!/bin/bash
# Docker Local Build & Test Script
# This script builds and runs the Shaxe app locally using Docker

set -e

echo "🚀 Shaxe Docker Local Build & Test"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building backend Docker image...${NC}"
docker build -f backend/Dockerfile -t shaxe-backend:latest .

echo -e "${YELLOW}📦 Building frontend Docker image...${NC}"
docker build -f frontend/Dockerfile -t shaxe-frontend:latest .

echo -e "${GREEN}✅ Docker images built successfully!${NC}"

echo ""
echo -e "${YELLOW}📋 To run containers locally:${NC}"
echo ""
echo "Backend:"
echo "  docker run -p 5000:5000 --env-file .env.railway.backend shaxe-backend:latest"
echo ""
echo "Frontend:"
echo "  docker run -p 3000:3000 --env-file frontend/.env.railway shaxe-frontend:latest"
echo ""
echo "Or use docker-compose (if you create docker-compose.yml):"
echo "  docker-compose up"
echo ""
echo -e "${GREEN}✅ Build complete! Ready for Railway deployment.${NC}"
