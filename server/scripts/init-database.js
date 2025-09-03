#!/usr/bin/env node

/**
 * Database initialization script
 * Run this script to set up the BigQuery dataset and tables
 */

require('dotenv').config({ path: '../.env' });
const { initializeDatabase } = require('../config/bigquery');

async function main() {
  console.log('🚀 Initializing database...');
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Dataset and tables created:');
    console.log('   - rulemakings');
    console.log('   - submissions');
    console.log('   - analytics');
    console.log('\n🎉 You can now start the application!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
