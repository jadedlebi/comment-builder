# Government Comment Submission Tool

A dynamic application that helps users submit personalized comment letters in response to government rulemaking notices. Built with React, Node.js, and BigQuery, this tool can handle any agency's rulemaking process.

## Features

- **Dynamic Rulemaking Support**: Handle any government agency's rulemaking notices
- **AI-Powered Comment Generation**: Uses Claude Sonnet 4 to create personalized comment letters
- **User-Friendly Interface**: Step-by-step process for creating and submitting comments
- **BigQuery Integration**: Automated tracking and analytics of submissions
- **reCAPTCHA Protection**: Prevents spam and ensures legitimate submissions
- **Admin Dashboard**: Manage rulemakings and view submission analytics
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: React with modern UI components
- **Backend**: Node.js/Express API server
- **Database**: Google BigQuery for scalable data storage
- **AI Service**: Claude Sonnet 4 for comment generation
- **Security**: reCAPTCHA verification and rate limiting

## Prerequisites

- Node.js 16+ and npm
- Google Cloud Platform account with BigQuery enabled
- Claude API key
- reCAPTCHA site and secret keys

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cfpb_comment_app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Configure BigQuery**
   - Create a Google Cloud project
   - Enable BigQuery API
   - Create a service account and download the JSON key
   - Copy the service account credentials to your .env file using the BQ_* variables

5. **Initialize the database**
   ```bash
   cd server
   node scripts/init-database.js
   node scripts/seed-data.js
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Environment Variables

### Server (.env)
```env
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
```

### Client (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# reCAPTCHA Configuration
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

## Database Schema

The application uses three main BigQuery tables:

### rulemakings
- Stores information about government rulemaking notices
- Includes agency, title, description, deadlines, and legal analysis

### submissions
- Tracks user submissions and generated comments
- Includes user information, generated content, and submission status

### analytics
- Daily aggregated statistics for dashboard reporting
- Tracks submission counts, user demographics, and engagement metrics

## API Endpoints

### Rulemakings
- `GET /api/rulemakings` - Get all active rulemakings
- `GET /api/rulemakings/:id` - Get specific rulemaking
- `POST /api/rulemakings` - Create new rulemaking (admin)
- `PUT /api/rulemakings/:id` - Update rulemaking (admin)

### Comments
- `POST /api/comments/generate` - Generate a comment letter
- `PUT /api/comments/:id` - Update a comment
- `GET /api/comments/:id` - Get a specific comment

### Submissions
- `GET /api/submissions` - Get all submissions (admin)
- `GET /api/submissions/stats` - Get submission statistics
- `GET /api/submissions/export` - Export submissions data

## Usage

### For Users
1. Visit the homepage to see active rulemakings
2. Click on a rulemaking to start the comment process
3. Fill out the form with your personal information and experiences
4. Review and edit the generated comment letter
5. Copy the letter and submit it to the official Federal Register portal

### For Administrators
1. Access the admin dashboard at `/admin`
2. View submission statistics and analytics
3. Manage active rulemakings
4. Export submission data for analysis

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
cd server && npm test
cd client && npm test
```

### Building for Production
```bash
npm run build
```

## Deployment

### Environment Setup
1. Set up production environment variables
2. Configure BigQuery for production
3. Set up proper CORS origins
4. Configure rate limiting for production traffic

### Build and Deploy
```bash
npm run build
# Deploy the built files to your hosting platform
```

## Security Considerations

- All API endpoints are rate-limited
- reCAPTCHA verification prevents spam
- Input validation on all forms
- Secure handling of user data
- CORS protection configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please contact the development team or create an issue in the repository.
