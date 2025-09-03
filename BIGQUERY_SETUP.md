# BigQuery Setup Guide

This guide will help you configure BigQuery for the Government Comment Submission Tool using service account credentials.

> **Note**: This application uses service account credentials directly in environment variables. You do **NOT** need `GOOGLE_APPLICATION_CREDENTIALS`, `BIGQUERY_PROJECT_ID`, or `BIGQUERY_DATASET_ID` variables.

## 📋 Required Environment Variables

You'll need to set these environment variables in your `.env` file:

```env
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
```

## 🔧 How to Get These Values

### Option 1: From Your Existing Project
If you already have a BigQuery service account set up in another project, you can copy the values from your existing `.env` file or service account JSON file.

### Option 2: Create New Service Account

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project (or create a new one)

2. **Enable BigQuery API**
   - Go to "APIs & Services" > "Library"
   - Search for "BigQuery API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name: `comment-app-service`
   - Description: `Service account for comment submission app`
   - Click "Create and Continue"

4. **Grant Permissions**
   - Role: `BigQuery Admin` (or `BigQuery Data Editor` + `BigQuery Job User`)
   - Click "Continue" and "Done"

5. **Create and Download Key**
   - Click on your new service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

6. **Extract Values from JSON**
   Open the downloaded JSON file and map the values:

   ```json
   {
     "type": "service_account",                    → BQ_TYPE
     "project_id": "your-project-123",            → BQ_PROJECT_ID
     "private_key_id": "abc123...",               → BQ_PRIVATE_KEY_ID
     "private_key": "-----BEGIN PRIVATE KEY-----\n...", → BQ_PRIVATE_KEY
     "client_email": "service@project.iam.gserviceaccount.com", → BQ_CLIENT_EMAIL
     "client_id": "123456789...",                 → BQ_CLIENT_ID
     "auth_uri": "https://accounts.google.com/o/oauth2/auth", → BQ_AUTH_URI
     "token_uri": "https://oauth2.googleapis.com/token", → BQ_TOKEN_URI
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", → BQ_AUTH_PROVIDER_X509_CERT_URL
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...", → BQ_CLIENT_X509_CERT_URL
   }
   ```

## ⚠️ Important Notes

### Private Key Formatting
The `BQ_PRIVATE_KEY` must include the full private key with proper line breaks:

```env
BQ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Dataset Name
The `BIGQUERY_DATASET` variable should be the name of your dataset (default: `comment_submissions`). This will be created automatically when you run the initialization script.

## 🧪 Testing Your Configuration

After setting up your environment variables, test the connection:

```bash
cd server
node scripts/test-bigquery.js
```

This will:
- ✅ Test the BigQuery connection
- ✅ Verify your credentials
- ✅ Check if the dataset exists
- ✅ List existing tables

## 🚀 Next Steps

1. **Set up your environment variables** in `.env`
2. **Test the connection**: `node scripts/test-bigquery.js`
3. **Initialize the database**: `node scripts/init-database.js`
4. **Seed sample data**: `node scripts/seed-data.js`
5. **Start the application**: `./start.sh`

## 🔒 Security Best Practices

- Never commit your `.env` file to version control
- Use environment-specific service accounts
- Regularly rotate your service account keys
- Grant minimal required permissions
- Monitor service account usage in Google Cloud Console

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

### Getting Help

If you encounter issues:
1. Check the error message from the test script
2. Verify your service account permissions in Google Cloud Console
3. Ensure all environment variables are properly formatted
4. Check that the BigQuery API is enabled in your project
