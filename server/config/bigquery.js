const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client with service account credentials
const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
  credentials: {
    type: process.env.BQ_TYPE,
    project_id: process.env.BQ_PROJECT_ID,
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

// Function to get dataset ID dynamically
function getDatasetId() {
  return process.env.BIGQUERY_DATASET || 'comment_submissions';
}

// Debug logging
console.log('🔍 BigQuery Configuration:');
console.log('   Project ID:', process.env.BQ_PROJECT_ID);
console.log('   Dataset ID:', getDatasetId());
console.log('   Environment:', process.env.NODE_ENV);

// Table schemas
const tableSchemas = {
  rulemakings: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'agency', type: 'STRING', mode: 'REQUIRED' },
    { name: 'title', type: 'STRING', mode: 'REQUIRED' },
    { name: 'description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'docket_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'federal_register_url', type: 'STRING', mode: 'NULLABLE' },
    { name: 'comment_deadline', type: 'DATE', mode: 'REQUIRED' },
    { name: 'status', type: 'STRING', mode: 'REQUIRED' }, // 'active', 'closed', 'draft'
    { name: 'context_documents', type: 'JSON', mode: 'NULLABLE' }, // Array of document URLs/descriptions
    { name: 'legal_analysis', type: 'STRING', mode: 'NULLABLE' },
    { name: 'opposition_points', type: 'JSON', mode: 'NULLABLE' }, // Array of key opposition points
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  
  submissions: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'rulemaking_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'user_name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'user_email', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_city', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_state', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_zip', type: 'STRING', mode: 'NULLABLE' },
    { name: 'personal_story', type: 'STRING', mode: 'NULLABLE' },
    { name: 'why_it_matters', type: 'STRING', mode: 'NULLABLE' },
    { name: 'experiences', type: 'STRING', mode: 'NULLABLE' },
    { name: 'concerns', type: 'STRING', mode: 'NULLABLE' },
    { name: 'generated_comment', type: 'STRING', mode: 'REQUIRED' },
    { name: 'final_comment', type: 'STRING', mode: 'NULLABLE' },
    { name: 'submission_status', type: 'STRING', mode: 'REQUIRED' }, // 'draft', 'submitted', 'failed'
    { name: 'federal_register_submission_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'ip_address', type: 'STRING', mode: 'NULLABLE' },
    { name: 'user_agent', type: 'STRING', mode: 'NULLABLE' },
    { name: 'recaptcha_verified', type: 'BOOLEAN', mode: 'REQUIRED' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'submitted_at', type: 'TIMESTAMP', mode: 'NULLABLE' }
  ],
  
  analytics: [
    { name: 'date', type: 'DATE', mode: 'REQUIRED' },
    { name: 'rulemaking_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'total_submissions', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'unique_users', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'states_represented', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'avg_comment_length', type: 'FLOAT', mode: 'REQUIRED' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ]
};

// Initialize dataset and tables
async function initializeDatabase() {
  try {
    // Create dataset if it doesn't exist
    const datasetId = getDatasetId();
    const [dataset] = await bigquery.dataset(datasetId).get({ autoCreate: true });
    console.log(`📊 Dataset ${datasetId} ready`);

    // Create tables
    for (const [tableName, schema] of Object.entries(tableSchemas)) {
      const tableId = `${datasetId}.${tableName}`;
      const [table] = await bigquery.dataset(datasetId).table(tableName).get({ 
        autoCreate: true,
        schema: schema
      });
      console.log(`📋 Table ${tableName} ready`);
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Helper functions for database operations
const db = {
  // Insert a new record
  async insert(tableName, data) {
    const datasetId = getDatasetId();
    const table = bigquery.dataset(datasetId).table(tableName);
    const [job] = await table.insert(data);
    return job;
  },

  // Query data
  async query(sql, params = {}) {
    const options = {
      query: sql,
      params: params
    };
    const [rows] = await bigquery.query(options);
    return rows;
  },

  // Get a single record by ID
  async getById(tableName, id) {
    const datasetId = getDatasetId();
    const sql = `SELECT * FROM \`${datasetId}.${tableName}\` WHERE id = @id`;
    const rows = await this.query(sql, { id });
    return rows[0] || null;
  },

  // Update a record
  async update(tableName, id, updates) {
    const datasetId = getDatasetId();
    const setClause = Object.keys(updates)
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    // Only add updated_at if the table has that field
    const hasUpdatedAt = tableSchemas[tableName]?.some(field => field.name === 'updated_at');
    const updatedAtClause = hasUpdatedAt ? ', updated_at = CURRENT_TIMESTAMP()' : '';
    
    const sql = `
      UPDATE \`${datasetId}.${tableName}\` 
      SET ${setClause}${updatedAtClause}
      WHERE id = @id
    `;
    
    const params = { ...updates, id };
    
    try {
      await this.query(sql, params);
    } catch (error) {
      // Handle BigQuery streaming buffer limitation
      if (error.message && error.message.includes('streaming buffer')) {
        console.warn(`Cannot update ${tableName} record ${id} - still in streaming buffer. This is normal for recently inserted records.`);
        // For development, we'll just log this and continue
        // In production, you might want to implement a retry mechanism or different approach
        return;
      }
      throw error;
    }
  },

  // Get submissions for a rulemaking
  async getSubmissionsByRulemaking(rulemakingId) {
    const datasetId = getDatasetId();
    const sql = `
      SELECT * FROM \`${datasetId}.submissions\` 
      WHERE rulemaking_id = @rulemakingId 
      ORDER BY created_at DESC
    `;
    return await this.query(sql, { rulemakingId });
  },

  // Get analytics for a rulemaking
  async getAnalytics(rulemakingId, startDate, endDate) {
    const datasetId = getDatasetId();
    const sql = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT user_name) as unique_users,
        COUNT(DISTINCT user_state) as states_represented,
        AVG(LENGTH(generated_comment)) as avg_comment_length
      FROM \`${datasetId}.submissions\`
      WHERE rulemaking_id = @rulemakingId
        AND created_at >= @startDate
        AND created_at <= @endDate
    `;
    return await this.query(sql, { rulemakingId, startDate, endDate });
  }
};

module.exports = {
  bigquery,
  getDatasetId,
  tableSchemas,
  initializeDatabase,
  db
};
