const requiredEnvVars = [
  'CLAUDE_API_KEY',
  'BQ_PROJECT_ID',
  'BQ_TYPE',
  'BQ_PRIVATE_KEY_ID',
  'BQ_PRIVATE_KEY',
  'BQ_CLIENT_EMAIL',
  'BQ_CLIENT_ID',
  'BQ_AUTH_URI',
  'BQ_TOKEN_URI',
  'BQ_AUTH_PROVIDER_X509_CERT_URL',
  'BQ_CLIENT_X509_CERT_URL'
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'CLAUDE_MODEL',
  'BIGQUERY_DATASET',
  'RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
  'CLIENT_URL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required environment variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional but recommended environment variables
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('These have default values but you may want to configure them.\n');
  }

  console.log('✅ Environment validation passed');
}

module.exports = { validateEnv };
