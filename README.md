# CFPB Comment Builder

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
Create a `server/.env` file with the following structure:

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

# Environment
NODE_ENV=production
```

## 🚀 Deployment

### Google Cloud Setup
1. Create a Google Cloud project
2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```
3. Set up authentication:
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
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

### Dynamic Admin System
The application uses a database-driven authentication system that allows you to add, remove, and manage admin users without code changes.

### Initial Setup
After deployment, create the admin table:
```bash
# Connect to your deployed service
curl -X POST https://your-service-url/api/admin/setup
```

### Admin Access
- **Login**: `/admin/login`
- **Dashboard**: `/admin`
- **API Endpoints**: `/api/admin/*`

### Admin Management Features
- **Dynamic Admin Management**: Add/remove admins through API endpoints
- **Secure Password Storage**: Passwords are hashed using bcrypt
- **Database-Driven**: All admin data stored in BigQuery
- **No Code Changes**: Add new admins without touching the codebase
- **Audit Trail**: Track creation, updates, and last login times

## 📊 Database Schema

### Admin Users Table
```sql
- id: STRING (unique identifier)
- email: STRING (admin email address)
- password_hash: STRING (bcrypt hashed password)
- name: STRING (admin display name)
- role: STRING (admin role - default: 'admin')
- is_active: BOOLEAN (account status)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP
```

### Comment Submissions Table
```sql
- id: STRING (unique identifier)
- rulemaking_id: STRING (reference to rulemaking)
- user_name: STRING (submitter name)
- user_email: STRING (submitter email)
- user_city: STRING (submitter city)
- user_state: STRING (submitter state)
- user_zip: STRING (submitter zip code)
- personal_story: STRING (personal story text)
- why_it_matters: STRING (why it matters text)
- experiences: STRING (experiences text)
- concerns: STRING (concerns text)
- generated_comment: STRING (AI-generated comment)
- status: STRING (submission status)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

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

## 🔒 Security Features

- **Password Hashing**: All passwords stored as bcrypt hashes
- **Token-Based Auth**: Session tokens for API access
- **Database Security**: No credentials in code or environment variables
- **Audit Logging**: Track all admin activities
- **Role-Based Access**: Support for different admin roles
- **reCAPTCHA Protection**: Spam protection for comment generation

## 🎯 Features

- ✅ Dynamic admin management system
- ✅ Secure password hashing
- ✅ Database-driven authentication
- ✅ API endpoints for admin CRUD operations
- ✅ Protected admin routes
- ✅ AI-powered comment generation
- ✅ reCAPTCHA spam protection
- ✅ Responsive text wrapping
- ✅ Comprehensive documentation
- ✅ Simple deployment process
- ✅ Manual deployment control

## 🆘 Troubleshooting

### Common Issues

**"Authentication failed"**
- Check that all BQ_* variables are set correctly
- Verify the private key includes proper line breaks (`\n`)
- Ensure the service account has BigQuery permissions

**"Project not found"**
- Verify BQ_PROJECT_ID is correct
- Check that BigQuery API is enabled
- Ensure you have access to the project

**"Dataset not found"**
- This is normal for first-time setup
- Run `node scripts/init-database.js` to create the dataset

**Text overflow issues**
- Fixed with proper CSS word-wrapping
- Uses `word-break: break-word` and `overflow-wrap: anywhere`

## 📞 Support

- **Issues**: Create issues in the GitHub repository
- **Documentation**: See individual markdown files in the project
- **Deployment**: Check deployment logs with `make logs`