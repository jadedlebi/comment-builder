#!/bin/bash

# Quick deploy using gcloud run deploy with source
# This bypasses the container registry issues

set -e

echo "🚀 Quick Deploy to Cloud Run"
echo "============================="

# Deploy directly from source
gcloud run deploy comment-builder \
    --source . \
    --platform managed \
    --region us-east1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars NODE_ENV=production

echo "✅ Deployment complete!"
echo "🌐 Service URL:"
SERVICE_URL=$(gcloud run services describe comment-builder --region=us-east1 --format="value(status.url)")
echo $SERVICE_URL

echo "🔧 Updating API URL environment variable..."
gcloud run services update comment-builder \
    --region=us-east1 \
    --set-env-vars NODE_ENV=production,REACT_APP_API_URL=$SERVICE_URL/api

echo "✅ API URL updated to: $SERVICE_URL/api"