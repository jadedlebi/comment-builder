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
gcloud run services describe comment-builder --region=us-east1 --format="value(status.url)"