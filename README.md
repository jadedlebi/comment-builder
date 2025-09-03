# Comment Builder

A full-stack application for generating and managing regulatory comments with dynamic admin management. Supports multiple agencies including CFPB, SEC, and other regulatory bodies.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker
- Google Cloud CLI (gcloud)

### Setup
```bash
# Clone the repository
git clone https://github.com/jadedlebi/comment-builder.git
cd comment-builder

# Run setup script
./setup.sh

# Or manually install dependencies
make install
```

### Development
```bash
# Start development servers
make dev

# Or start individually
cd client && npm start    # Frontend on http://localhost:3000
cd server && npm start    # Backend on http://localhost:3001
```

### Deployment
```bash
# Deploy to Google Cloud Run
make deploy

# Or use the deploy script directly
./deploy.sh
```

## 📋 Available Commands

```bash
make help      # Show all available commands
make install   # Install dependencies
make build     # Build the client
make dev       # Start development servers
make deploy    # Deploy to Cloud Run
make logs      # View Cloud Run logs
make status    # Check deployment status
make url       # Get service URL
make health    # Check service health
make clean     # Clean build artifacts
```

## 🔧 Configuration

### Environment Variables
Create a `server/.env` file with:
```env
# BigQuery Configuration
BQ_PROJECT_ID=your-project-id
BQ_TYPE=service_account
BQ_PRIVATE_KEY_ID=your-key-id
BQ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BQ_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
BQ_CLIENT_ID=your-client-id
BQ_AUTH_URI=https://accounts.google.com/o/oauth2/auth
BQ_TOKEN_URI=https://oauth2.googleapis.com/token
BQ_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
BQ_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# BigQuery Dataset
BIGQUERY_DATASET=cfpb

# Claude API
CLAUDE_API_KEY=your-claude-api-key
CLAUDE_MODEL=claude-3-sonnet-20240229

# reCAPTCHA (optional)
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

## 🚀 Deployment

### Google Cloud Setup
1. Create a Google Cloud project: `comment-builder`
2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```
3. Set up authentication:
   ```bash
   gcloud auth login
   gcloud config set project comment-builder
   ```

### Deploy
```bash
# Simple deployment
make deploy

# Or step by step
make build
./deploy.sh
```

## 🔐 Admin Management

### Initial Setup
After deployment, create the admin table:
```bash
# Connect to your deployed service
curl -X POST https://your-service-url/api/admin/setup
```

### Admin Access
- **Login**: `/admin/login`
- **Dashboard**: `/admin`
- **Default credentials**: See `ADMIN_CREDENTIALS.md`

## 📊 Project Structure

```
comment_builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── scripts/          # Database scripts
│   └── package.json
├── Dockerfile            # Container configuration
├── Makefile             # Build commands
├── deploy.sh            # Deployment script
└── setup.sh             # Setup script
```

## 🛠️ Development

### Adding New Features
1. Make changes to the code
2. Test locally: `make dev`
3. Deploy: `make deploy`

### Database Changes
1. Update database scripts in `server/scripts/`
2. Run scripts on deployed service
3. Test changes

## 📞 Support

- **Issues**: Create issues in the GitHub repository
- **Documentation**: See individual markdown files in the project
- **Deployment**: Check `GOOGLE_CLOUD_DEPLOYMENT.md`

## 🎯 Features

- ✅ Dynamic admin management system
- ✅ Secure password hashing
- ✅ Database-driven authentication
- ✅ API endpoints for admin CRUD operations
- ✅ Protected admin routes
- ✅ Comprehensive documentation
- ✅ Simple deployment process
- ✅ Manual deployment control