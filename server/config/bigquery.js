const { BigQuery } = require('@google-cloud/bigquery');

// Initialize BigQuery client
// Use Application Default Credentials for Cloud Run
const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID
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
    { name: 'ncrc_comment_letter', type: 'STRING', mode: 'NULLABLE' }, // NCRC comment letter text for AI context
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
    try {
      console.log('🔍 BigQuery insert - Table:', tableName);
      console.log('🔍 BigQuery insert - Data:', JSON.stringify(data, null, 2));
      
      const datasetId = getDatasetId();
      console.log('🔍 BigQuery insert - Dataset ID:', datasetId);
      
      const table = bigquery.dataset(datasetId).table(tableName);
      console.log('🔍 BigQuery insert - Table reference created');
      
      const [job] = await table.insert(data);
      console.log('✅ BigQuery insert - Job completed:', job);
      return job;
    } catch (error) {
      console.error('❌ BigQuery insert error:', error);
      console.error('❌ BigQuery insert error details:', {
        code: error.code,
        message: error.message,
        errors: error.errors
      });
      throw error;
    }
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
    
    console.log('🔍 BigQuery update - SQL:', sql);
    console.log('🔍 BigQuery update - Params:', JSON.stringify(params, null, 2));
    
    try {
      const result = await this.query(sql, params);
      console.log('✅ BigQuery update - Result:', result);
      return result;
    } catch (error) {
      console.error('❌ BigQuery update error:', error);
      console.error('❌ BigQuery update error details:', {
        code: error.code,
        message: error.message,
        errors: error.errors
      });
      
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
  },

  // Delete a record
  async delete(tableName, id) {
    const datasetId = getDatasetId();
    const sql = `DELETE FROM \`${datasetId}.${tableName}\` WHERE id = @id`;
    
    console.log('🔍 BigQuery delete - SQL:', sql);
    console.log('🔍 BigQuery delete - ID:', id);
    
    try {
      const result = await this.query(sql, { id });
      console.log('✅ BigQuery delete - Result:', result);
      return result;
    } catch (error) {
      console.error('❌ BigQuery delete error:', error);
      console.error('❌ BigQuery delete error details:', {
        code: error.code,
        message: error.message,
        errors: error.errors
      });
      throw error;
    }
  }
};

module.exports = {
  bigquery,
  getDatasetId,
  tableSchemas,
  initializeDatabase,
  db
};
