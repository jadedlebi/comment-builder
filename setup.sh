#!/bin/bash

# CFPB Comment Builder - Setup Script
# Similar to branch_ai setup approach

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CFPB Comment Builder - Setup${NC}"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://nodejs.org/${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Install client dependencies
echo -e "${BLUE}📦 Installing client dependencies...${NC}"
cd client
npm install
cd ..

# Install server dependencies
echo -e "${BLUE}📦 Installing server dependencies...${NC}"
cd server
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud CLI is not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://cloud.google.com/sdk/docs/install${NC}"
    echo -e "${YELLOW}   You'll need it for deployment${NC}"
else
    echo -e "${GREEN}✅ gcloud CLI is installed${NC}"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://docs.docker.com/get-docker/${NC}"
    echo -e "${YELLOW}   You'll need it for deployment${NC}"
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${YELLOW}   1. Set up your environment variables${NC}"
echo -e "${YELLOW}   2. Run: make dev (to start development servers)${NC}"
echo -e "${YELLOW}   3. Run: make deploy (to deploy to Cloud Run)${NC}"
echo ""
echo -e "${BLUE}🔧 Available Commands:${NC}"
echo -e "${YELLOW}   make help     - Show all available commands${NC}"
echo -e "${YELLOW}   make dev      - Start development servers${NC}"
echo -e "${YELLOW}   make build    - Build the client${NC}"
echo -e "${YELLOW}   make deploy   - Deploy to Cloud Run${NC}"
echo -e "${YELLOW}   make logs     - View Cloud Run logs${NC}"
echo -e "${YELLOW}   make status   - Check deployment status${NC}"