// This is an EXAMPLE file showing how to set up admin management
// Copy this file to admin-setup.js and customize for your environment
// DO NOT commit admin-setup.js to version control

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
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

async function addAdmin(email, password, name, role = 'admin') {
  try {
    console.log(`🔧 Adding new admin: ${email}`);

    // Check if admin already exists
    const checkQuery = `
      SELECT email 
      FROM \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
      WHERE email = @email
    `;

    const [existingRows] = await bigquery.query({
      query: checkQuery,
      params: { email: email }
    });

    if (existingRows.length > 0) {
      console.log('❌ Admin with this email already exists!');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    const adminId = uuidv4();
    const now = new Date().toISOString();

    // Insert new admin
    const insertQuery = `
      INSERT INTO \`${process.env.BQ_PROJECT_ID}.${datasetId}.${tableId}\`
      (id, email, password_hash, name, role, is_active, created_at, updated_at, last_login)
      VALUES (@id, @email, @password_hash, @name, @role, @is_active, @created_at, @updated_at, @last_login)
    `;

    await bigquery.query({
      query: insertQuery,
      params: {
        id: adminId,
        email: email,
        password_hash: passwordHash,
        name: name,
        role: role,
        is_active: true,
        created_at: now,
        updated_at: now,
        last_login: null
      }
    });

    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Role: ${role}`);
    console.log(`🆔 ID: ${adminId}`);

  } catch (error) {
    console.error('❌ Error adding admin:', error);
    throw error;
  }
}

// Example usage:
// addAdmin('newadmin@ncrc.org', 'SecurePassword123!', 'New Admin Name', 'admin');

module.exports = { addAdmin };
