# ✅ Google Cloud Run Deployment Checklist

## 🔧 Pre-Deployment Setup

### Google Cloud Setup
- [ ] Google Cloud account created with billing enabled
- [ ] New project created: `cfpb-comment-builder`
- [ ] Required APIs enabled:
  - [ ] Cloud Build API
  - [ ] Cloud Run API
  - [ ] Container Registry API
  - [ ] BigQuery API
  - [ ] Secret Manager API
- [ ] Service account created for GitHub Actions
- [ ] Service account key downloaded (`github-actions-key.json`)

### GitHub Repository Setup
- [ ] Repository created at `https://github.com/jadedlebi/comment-builder.git`
- [ ] Code pushed to repository
- [ ] GitHub Actions enabled
- [ ] Repository secrets configured (see below)

### Required GitHub Secrets
- [ ] `GCP_PROJECT_ID` = `cfpb-comment-builder`
- [ ] `GCP_SA_KEY` = `<entire service account JSON>`
- [ ] `BQ_PROJECT_ID` = `<your-bigquery-project-id>`
- [ ] `BQ_TYPE` = `service_account`
- [ ] `BQ_PRIVATE_KEY_ID` = `<private-key-id>`
- [ ] `BQ_PRIVATE_KEY` = `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
- [ ] `BQ_CLIENT_EMAIL` = `<service-account-email>`
- [ ] `BQ_CLIENT_ID` = `<client-id>`
- [ ] `BQ_AUTH_URI` = `https://accounts.google.com/o/oauth2/auth`
- [ ] `BQ_TOKEN_URI` = `https://oauth2.googleapis.com/token`
- [ ] `BQ_AUTH_PROVIDER_X509_CERT_URL` = `https://www.googleapis.com/oauth2/v1/certs`
- [ ] `BQ_CLIENT_X509_CERT_URL` = `https://www.googleapis.com/robot/v1/metadata/x509/...`
- [ ] `BIGQUERY_DATASET` = `cfpb`
- [ ] `CLAUDE_API_KEY` = `<your-claude-api-key>`
- [ ] `CLAUDE_MODEL` = `claude-3-sonnet-20240229`
- [ ] `RECAPTCHA_SITE_KEY` = `<your-recaptcha-site-key>` (optional)
- [ ] `RECAPTCHA_SECRET_KEY` = `<your-recaptcha-secret-key>` (optional)

## 🚀 Deployment Process

### Automated Deployment (Recommended)
- [ ] Push code to `main` branch
- [ ] GitHub Actions workflow runs automatically
- [ ] Check Actions tab for deployment status
- [ ] Note the deployed service URL

### Manual Deployment (Alternative)
- [ ] Run `./deploy.sh` script
- [ ] Or use gcloud commands directly
- [ ] Verify deployment in Google Cloud Console

## 🔧 Post-Deployment Setup

### Environment Configuration
- [ ] Update `CLIENT_URL` secret with actual Cloud Run service URL
- [ ] Verify all environment variables are set correctly
- [ ] Test health check endpoint: `https://your-service-url/health`

### Database Setup
- [ ] Run admin table creation script
- [ ] Verify BigQuery connection
- [ ] Test admin authentication

### Security Verification
- [ ] Admin management scripts are NOT in repository
- [ ] No hardcoded credentials in code
- [ ] All sensitive data in GitHub secrets
- [ ] HTTPS enforced (automatic with Cloud Run)

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Health check endpoint responds: `/health`
- [ ] Admin login works: `/admin/login`
- [ ] Admin dashboard accessible: `/admin`
- [ ] Public pages load: `/`, `/comment/:id`

### API Endpoints
- [ ] Authentication: `POST /api/auth/admin/login`
- [ ] Admin management: `GET /api/admin/admins`
- [ ] Comment generation: `POST /api/comments`
- [ ] Rulemakings: `GET /api/rulemakings`

### Security Tests
- [ ] Unauthenticated access to `/admin` redirects to login
- [ ] Invalid credentials rejected
- [ ] CORS headers properly set
- [ ] No sensitive data in response headers

## 📊 Monitoring Setup

### Google Cloud Console
- [ ] Cloud Run service visible and running
- [ ] Logs accessible and readable
- [ ] Metrics showing normal operation
- [ ] No error alerts

### Performance Monitoring
- [ ] Response times under 2 seconds
- [ ] Memory usage under 1GB
- [ ] CPU usage reasonable
- [ ] No timeout errors

## 🔒 Security Audit

### Access Control
- [ ] Only authorized admins can access admin panel
- [ ] Public endpoints properly secured
- [ ] No unauthorized database access
- [ ] API rate limiting configured

### Data Protection
- [ ] Passwords properly hashed
- [ ] No sensitive data in logs
- [ ] Database credentials secure
- [ ] API keys not exposed

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Documentation
- [ ] Deployment guide updated
- [ ] Admin credentials documented
- [ ] Troubleshooting guide ready
- [ ] Contact information available

### Team Access
- [ ] Admin accounts created for team members
- [ ] Access credentials shared securely
- [ ] Training completed
- [ ] Support procedures established

## 🚨 Emergency Procedures

### Rollback Plan
- [ ] Previous version can be deployed quickly
- [ ] Database rollback procedures documented
- [ ] Emergency contacts available
- [ ] Incident response plan ready

### Monitoring Alerts
- [ ] Error rate alerts configured
- [ ] Performance degradation alerts
- [ ] Security incident alerts
- [ ] Availability monitoring

## 📞 Support Information

### Key Contacts
- [ ] Technical lead: [Name and contact]
- [ ] Database admin: [Name and contact]
- [ ] Security officer: [Name and contact]
- [ ] Business owner: [Name and contact]

### Resources
- [ ] Google Cloud Console access
- [ ] GitHub repository access
- [ ] BigQuery console access
- [ ] Monitoring dashboard access

---

## 🎉 Deployment Complete!

Once all items are checked, your CFPB Comment Builder is ready for production use!

**Service URL**: `https://cfpb-comment-builder-xxxxx-uc.a.run.app`
**Admin Access**: `/admin/login`
**Health Check**: `/health`
