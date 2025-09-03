#!/bin/bash

# Government Comment App Setup Script

echo "🔧 Setting up Government Comment Submission Tool..."

# Create environment files
echo "📝 Creating environment files..."

# Server .env
cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Claude API Configuration
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-sonnet-4-20250514

# BigQuery Configuration (copy your exact values from your other project)
BQ_TYPE=service_account
BQ_PROJECT_ID=your_project_id
BQ_PRIVATE_KEY_ID=your_private_key_id
BQ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
BQ_CLIENT_EMAIL=your_service_account_email
BQ_CLIENT_ID=your_client_id
BQ_AUTH_URI=https://accounts.google.com/o/oauth2/auth
BQ_TOKEN_URI=https://oauth2.googleapis.com/token
BQ_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
BQ_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email
BIGQUERY_DATASET=comment_submissions

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
EOF

# Client .env
cat > client/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# reCAPTCHA Configuration
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
EOF

echo "✅ Environment files created!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env and client/.env with your actual credentials"
echo "2. Set up your Google Cloud BigQuery project"
echo "3. Get your Claude API key from Anthropic"
echo "4. Set up reCAPTCHA keys from Google"
echo "5. Run: ./start.sh"
echo ""
echo "🎉 Setup complete! Check the README.md for detailed instructions."
