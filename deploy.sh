#!/bin/bash

# CFPB Comment Builder - Manual Deployment Script
# Similar to branch_ai deployment approach

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="hdma1-242116"
SERVICE_NAME="comment-builder"
REGION="us-east1"
REPOSITORY="comment-builder-repo"
IMAGE_NAME="us-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE_NAME"

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo -e "${BLUE}📋 Loading environment variables from .env file...${NC}"
    # Use a more robust method to load env vars that handles multiline values
    set -a
    source .env
    set +a
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Comment Builder - Manual Deployment${NC}"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: Dockerfile not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image: $IMAGE_NAME"
echo ""

# Check if we're authenticated
echo -e "${BLUE}🔐 Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated. Please run: gcloud auth login${NC}"
    exit 1
fi

# Set the project
echo -e "${BLUE}🔧 Setting project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifacts Registry repository if it doesn't exist
echo -e "${BLUE}🔧 Creating Artifacts Registry repository...${NC}"
gcloud artifacts repositories create $REPOSITORY \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for comment-builder" \
    2>/dev/null || echo "Repository already exists"

# Configure Docker for Artifacts Registry
echo -e "${BLUE}🐳 Configuring Docker for Artifacts Registry...${NC}"
gcloud auth configure-docker us-docker.pkg.dev

# Build the Docker image
echo -e "${BLUE}🏗️  Building Docker image...${NC}"
docker build -t $IMAGE_NAME:latest .

# Push the image to Artifacts Registry
echo -e "${BLUE}📤 Pushing image to Artifacts Registry...${NC}"
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Google Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars NODE_ENV=production,CLAUDE_API_KEY="$CLAUDE_API_KEY",CLAUDE_MODEL="$CLAUDE_MODEL",BQ_TYPE="$BQ_TYPE",BQ_PROJECT_ID="$BQ_PROJECT_ID",BQ_PRIVATE_KEY_ID="$BQ_PRIVATE_KEY_ID",BQ_PRIVATE_KEY="$BQ_PRIVATE_KEY",BQ_CLIENT_EMAIL="$BQ_CLIENT_EMAIL",BQ_CLIENT_ID="$BQ_CLIENT_ID",BQ_AUTH_URI="$BQ_AUTH_URI",BQ_TOKEN_URI="$BQ_TOKEN_URI",BQ_AUTH_PROVIDER_X509_CERT_URL="$BQ_AUTH_PROVIDER_X509_CERT_URL",BQ_CLIENT_X509_CERT_URL="$BQ_CLIENT_X509_CERT_URL",BIGQUERY_DATASET="$BIGQUERY_DATASET",RECAPTCHA_SITE_KEY="$RECAPTCHA_SITE_KEY",RECAPTCHA_SECRET_KEY="$RECAPTCHA_SECRET_KEY",CLIENT_URL="$CLIENT_URL",RATE_LIMIT_WINDOW_MS="$RATE_LIMIT_WINDOW_MS",RATE_LIMIT_MAX_REQUESTS="$RATE_LIMIT_MAX_REQUESTS",REACT_APP_RECAPTCHA_SITE_KEY="$REACT_APP_RECAPTCHA_SITE_KEY"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test your deployment: curl $SERVICE_URL/health"
echo "2. Set up environment variables if needed"
echo "3. Run admin table creation script"
echo ""
echo -e "${BLUE}🔗 Cloud Run Console: https://console.cloud.google.com/run${NC}"
echo -e "${BLUE}🔗 Service URL: $SERVICE_URL${NC}"