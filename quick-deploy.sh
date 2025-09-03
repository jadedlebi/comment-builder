#!/bin/bash

# Quick deployment script for Cloud Run
set -e

echo "🚀 Quick Cloud Run Deployment"
echo "=============================="

# Check if we have the required environment variables
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ Please set GCP_PROJECT_ID environment variable"
    echo "Example: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

echo "📋 Project ID: $GCP_PROJECT_ID"

# Build and deploy
echo "🏗️ Building Docker image..."
docker build -t gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder:latest .

echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder:latest

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy cfpb-comment-builder \
    --image gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --set-env-vars NODE_ENV=production,PORT=8080

echo "✅ Deployment complete!"
echo "🌐 Your service should now be visible in Cloud Run console"
echo "🔗 Check: https://console.cloud.google.com/run"
