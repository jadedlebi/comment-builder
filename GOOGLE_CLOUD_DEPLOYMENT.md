# 🚀 Google Cloud Run Deployment Guide

Complete guide for deploying the CFPB Comment Builder to Google Cloud Run with automated CI/CD.

## 📋 Prerequisites

### 1. Google Cloud Account Setup
- [ ] Google Cloud account with billing enabled
- [ ] Google Cloud project created
- [ ] Required APIs enabled (see below)

### 2. GitHub Repository Setup
- [ ] Repository at `https://github.com/jadedlebi/comment-builder.git`
- [ ] GitHub Actions enabled
- [ ] Repository secrets configured (see below)

### 3. Local Development Tools
- [ ] Google Cloud SDK installed
- [ ] Docker installed
- [ ] Node.js 18+ installed

## 🔧 Google Cloud Setup

### Step 1: Create Google Cloud Project
```bash
# Create a new project (or use existing)
gcloud projects create cfpb-comment-builder --name="CFPB Comment Builder"

# Set the project ID
export GCP_PROJECT_ID="cfpb-comment-builder"
gcloud config set project $GCP_PROJECT_ID
```

### Step 2: Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 3: Create Service Account
```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions deployment" \
    --display-name="GitHub Actions"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com
```

## 🔐 GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets:
```bash
# Google Cloud
GCP_PROJECT_ID=cfpb-comment-builder
GCP_SA_KEY=<contents of github-actions-key.json>

# BigQuery
BQ_PROJECT_ID=cfpb-comment-builder
BQ_TYPE=service_account
BQ_PRIVATE_KEY_ID=<your-private-key-id>
BQ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BQ_CLIENT_EMAIL=<your-service-account@cfpb-comment-builder.iam.gserviceaccount.com>
BQ_CLIENT_ID=<your-client-id>
BQ_AUTH_URI=https://accounts.google.com/o/oauth2/auth
BQ_TOKEN_URI=https://oauth2.googleapis.com/token
BQ_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
BQ_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40cfpb-comment-builder.iam.gserviceaccount.com

# BigQuery Dataset
BIGQUERY_DATASET=cfpb

# Claude API
CLAUDE_API_KEY=<your-claude-api-key>
CLAUDE_MODEL=claude-3-sonnet-20240229

# reCAPTCHA (if using)
RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
RECAPTCHA_SECRET_KEY=<your-recaptcha-secret-key>

# Client URL (will be set after deployment)
CLIENT_URL=https://cfpb-comment-builder-xxxxx-uc.a.run.app
```

## 🚀 Deployment Methods

### Method 1: Automated Deployment (Recommended)

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to Cloud Run"
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Run tests
   - Build Docker image
   - Deploy to Cloud Run
   - Provide deployment URL

### Method 2: Manual Deployment

1. **Run the deployment script**:
   ```bash
   export GCP_PROJECT_ID="cfpb-comment-builder"
   ./deploy.sh
   ```

2. **Or use gcloud commands directly**:
   ```bash
   # Build and push image
   docker build -t gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder .
   docker push gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder

   # Deploy to Cloud Run
   gcloud run deploy cfpb-comment-builder \
       --image gcr.io/$GCP_PROJECT_ID/cfpb-comment-builder \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --memory 1Gi \
       --cpu 1 \
       --max-instances 10 \
       --min-instances 0
   ```

## 🔧 Post-Deployment Setup

### Step 1: Set Environment Variables
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe cfpb-comment-builder \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)')

# Update CLIENT_URL secret in GitHub
# Go to GitHub → Settings → Secrets → CLIENT_URL
# Set value to: $SERVICE_URL
```

### Step 2: Create Admin Table
```bash
# Connect to your Cloud Run service
gcloud run services proxy cfpb-comment-builder --port=8080

# In another terminal, run the admin setup
curl -X POST https://your-service-url.run.app/api/admin/setup
```

### Step 3: Test Deployment
```bash
# Health check
curl https://your-service-url/health

# Test admin login
curl -X POST https://your-service-url/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jedlebi@ncrc.org", "password": "NCRC2024!Admin1"}'
```

## 📊 Monitoring and Logs

### View Logs
```bash
# View recent logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=cfpb-comment-builder" --limit=50

# Follow logs in real-time
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=cfpb-comment-builder"
```

### Monitor Performance
- Go to Google Cloud Console → Cloud Run → cfpb-comment-builder
- View metrics, logs, and performance data
- Set up alerts for errors and performance issues

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ All sensitive data stored as GitHub secrets
- ✅ No hardcoded credentials in code
- ✅ Environment variables properly configured

### 2. Service Account
- ✅ Minimal permissions granted
- ✅ Service account key stored securely
- ✅ Regular key rotation recommended

### 3. Network Security
- ✅ HTTPS enforced by default
- ✅ No unauthenticated access to admin endpoints
- ✅ CORS properly configured

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**:
   ```bash
   # Check Docker build locally
   docker build -t test-image .
   docker run -p 8080:8080 test-image
   ```

2. **Deployment Fails**:
   ```bash
   # Check service account permissions
   gcloud projects get-iam-policy $GCP_PROJECT_ID
   ```

3. **Runtime Errors**:
   ```bash
   # Check logs
   gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=cfpb-comment-builder" --limit=100
   ```

4. **Database Connection Issues**:
   ```bash
   # Verify BigQuery credentials
   gcloud auth application-default login
   bq ls
   ```

### Performance Optimization

1. **Increase Resources**:
   ```bash
   gcloud run services update cfpb-comment-builder \
       --region us-central1 \
       --memory 2Gi \
       --cpu 2
   ```

2. **Enable Auto-scaling**:
   ```bash
   gcloud run services update cfpb-comment-builder \
       --region us-central1 \
       --min-instances 1 \
       --max-instances 20
   ```

## 📈 Scaling and Cost Management

### Cost Optimization
- **Min Instances**: 0 (pay only when used)
- **Max Instances**: 10 (prevent runaway costs)
- **Memory**: 1Gi (sufficient for most workloads)
- **CPU**: 1 (can be increased if needed)

### Monitoring Costs
- Set up billing alerts in Google Cloud Console
- Monitor usage in Cloud Run metrics
- Review costs monthly

## 🎯 Next Steps

1. **Set up monitoring alerts**
2. **Configure custom domain** (optional)
3. **Set up SSL certificate** (automatic with Cloud Run)
4. **Configure backup strategy** for BigQuery data
5. **Set up staging environment** for testing

## 📞 Support

- **Google Cloud Documentation**: https://cloud.google.com/run/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Project Issues**: Create issues in the GitHub repository
