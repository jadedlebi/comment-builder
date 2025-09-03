#!/usr/bin/env node

/**
 * BigQuery Connection Test Script
 * Run this script to test your BigQuery configuration
 */

require('dotenv').config({ path: '../.env' });
const { bigquery, getDatasetId } = require('../config/bigquery');

async function testBigQueryConnection() {
  console.log('🔍 Testing BigQuery connection...');
  
  try {
    // Test basic connection
    const datasetId = getDatasetId();
    console.log('📊 Project ID:', process.env.BQ_PROJECT_ID);
    console.log('📋 Dataset ID:', datasetId);
    
    // Test dataset access
    const [datasets] = await bigquery.getDatasets();
    console.log('✅ Successfully connected to BigQuery!');
    console.log(`📁 Found ${datasets.length} datasets in project`);
    
    // Check if our dataset exists
    const [dataset] = await bigquery.dataset(datasetId).get({ autoCreate: false });
    if (dataset) {
      console.log(`✅ Dataset '${datasetId}' exists`);
      
      // List tables in the dataset
      const [tables] = await dataset.getTables();
      console.log(`📋 Found ${tables.length} tables in dataset:`);
      tables.forEach(table => {
        console.log(`   - ${table.id}`);
      });
    } else {
      console.log(`⚠️  Dataset '${datasetId}' does not exist yet`);
      console.log('\n💡 You have two options:');
      console.log('   1. Update BIGQUERY_DATASET in your .env file to use an existing dataset');
      console.log('   2. Run: node scripts/init-database.js to create a new dataset');
      console.log('\n📋 Available datasets in your project:');
      const [allDatasets] = await bigquery.getDatasets();
      allDatasets.forEach(d => console.log(`   - ${d.id}`));
    }
    
    // Test a simple query
    const query = `SELECT 1 as test_value`;
    const [rows] = await bigquery.query(query);
    console.log('✅ Query test successful:', rows[0]);
    
    console.log('\n🎉 BigQuery connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ BigQuery connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication issue. Please check:');
      console.error('   - BQ_PROJECT_ID is correct');
      console.error('   - BQ_CLIENT_EMAIL is correct');
      console.error('   - BQ_PRIVATE_KEY is properly formatted');
      console.error('   - Service account has BigQuery permissions');
    } else if (error.message.includes('project')) {
      console.error('\n💡 Project issue. Please check:');
      console.error('   - BQ_PROJECT_ID exists and is accessible');
      console.error('   - BigQuery API is enabled in the project');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  testBigQueryConnection();
}

module.exports = testBigQueryConnection;
