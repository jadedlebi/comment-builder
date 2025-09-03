const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config({ path: '../.env' });

const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
  credentials: {
    type: process.env.BQ_TYPE,
    private_key_id: process.env.BQ_PRIVATE_KEY_ID,
    private_key: process.env.BQ_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.BQ_CLIENT_EMAIL,
    client_id: process.env.BQ_CLIENT_ID,
    auth_uri: process.env.BQ_AUTH_URI,
    token_uri: process.env.BQ_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.BQ_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.BQ_CLIENT_X509_CERT_URL
  }
});

const datasetId = process.env.BIGQUERY_DATASET || 'cfpb';
const tableId = 'admin_users';

async function createAdminTable() {
  try {
    console.log('🔧 Creating admin_users table...');

    const schema = [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'email', type: 'STRING', mode: 'REQUIRED' },
      { name: 'password_hash', type: 'STRING', mode: 'REQUIRED' },
      { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'role', type: 'STRING', mode: 'REQUIRED' },
      { name: 'is_active', type: 'BOOLEAN', mode: 'REQUIRED' },
      { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'last_login', type: 'TIMESTAMP', mode: 'NULLABLE' }
    ];

    const options = {
      schema: schema,
      location: 'US',
    };

    const [table] = await bigquery
      .dataset(datasetId)
      .createTable(tableId, options);

    console.log(`✅ Table ${table.id} created successfully.`);

    // Insert initial admin users
    await insertInitialAdmins();
    
  } catch (error) {
    if (error.code === 409) {
      console.log('📋 Table admin_users already exists.');
      console.log('🔄 Checking if initial admins need to be added...');
      await insertInitialAdmins();
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function insertInitialAdmins() {
  try {
    const bcrypt = require('bcrypt');
    
    // Hash the passwords
    const password1 = await bcrypt.hash('NCRC2024!Admin1', 10);
    const password2 = await bcrypt.hash('NCRC2024!Admin2', 10);

    const initialAdmins = [
      {
        id: 'admin-1',
        email: 'jedlebi@ncrc.org',
        password_hash: password1,
        name: 'Jed Lebi',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null
      },
      {
        id: 'admin-2',
        email: 'jrichardson@ncrc.org',
        password_hash: password2,
        name: 'J Richardson',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null
      }
    ];

    // Check if admins already exist
    const query = `
      SELECT email 
      FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
      WHERE email IN ('jedlebi@ncrc.org', 'jrichardson@ncrc.org')
    `;

    const [rows] = await bigquery.query(query);
    
    if (rows.length === 0) {
      console.log('👥 Inserting initial admin users...');
      
      await bigquery
        .dataset(datasetId)
        .table(tableId)
        .insert(initialAdmins);
        
      console.log('✅ Initial admin users created successfully.');
    } else {
      console.log('👥 Initial admin users already exist.');
    }
    
  } catch (error) {
    console.error('❌ Error inserting initial admins:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createAdminTable()
    .then(() => {
      console.log('🎉 Admin table setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminTable };
