// Simple script to create the deleted_rulemakings table
const { BigQuery } = require('@google-cloud/bigquery');

async function createTable() {
  try {
    // Use Application Default Credentials
    const bigquery = new BigQuery({
      projectId: 'hdma1-242116'
    });

    const datasetId = 'cfpb';
    
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
    console.log('🔗 BigQuery Console: https://console.cloud.google.com/bigquery?project=hdma1-242116&ws=!1m4!1m3!1m2!1shdma1-242116!2scfpb!3sdeleted_rulemakings');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

createTable();
