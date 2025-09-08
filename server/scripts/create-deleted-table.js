const { BigQuery } = require('@google-cloud/bigquery');

async function createDeletedTable() {
  try {
    console.log('🔧 Creating deleted_rulemakings table...');
    
    // Initialize BigQuery with service account credentials
    const credentials = {
      type: 'service_account',
      project_id: process.env.BQ_PROJECT_ID,
      private_key_id: process.env.BQ_PRIVATE_KEY_ID,
      private_key: process.env.BQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.BQ_CLIENT_EMAIL,
      client_id: process.env.BQ_CLIENT_ID,
      auth_uri: process.env.BQ_AUTH_URI,
      token_uri: process.env.BQ_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.BQ_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.BQ_CLIENT_X509_CERT_URL
    };

    console.log('🔍 Using credentials for:', credentials.client_email);

    const bigquery = new BigQuery({
      projectId: process.env.BQ_PROJECT_ID,
      credentials: credentials
    });

    const datasetId = process.env.BIGQUERY_DATASET || 'cfpb';
    
    // Create dataset if it doesn't exist
    const [dataset] = await bigquery.dataset(datasetId).get({ autoCreate: true });
    console.log(`📊 Dataset ${datasetId} ready`);

    // Create deleted_rulemakings table
    const tableSchema = [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'deleted_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'deleted_by', type: 'STRING', mode: 'NULLABLE' },
      { name: 'original_data', type: 'JSON', mode: 'NULLABLE' }
    ];

    const [table] = await bigquery.dataset(datasetId).table('deleted_rulemakings').get({ 
      autoCreate: true,
      schema: tableSchema
    });
    
    console.log('✅ deleted_rulemakings table created successfully!');
    console.log('📊 You can now see it in your BigQuery console');
    console.log(`🔗 BigQuery Console: https://console.cloud.google.com/bigquery?project=${process.env.BQ_PROJECT_ID}&ws=!1m4!1m3!1m2!1s${process.env.BQ_PROJECT_ID}!2s${datasetId}!3sdeleted_rulemakings`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating deleted_rulemakings table:', error);
    process.exit(1);
  }
}

createDeletedTable();
