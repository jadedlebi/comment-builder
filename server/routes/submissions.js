const express = require('express');
const { db, getDatasetId } = require('../config/bigquery');

const router = express.Router();

// GET /api/submissions - Get all submissions (admin only)
router.get('/', async (req, res, next) => {
  try {
    const { rulemaking_id, status, limit = 100, offset = 0 } = req.query;
    
    const datasetId = getDatasetId();
    let sql = `SELECT * FROM \`${datasetId}.submissions\``;
    const params = {};
    const conditions = [];

    if (rulemaking_id) {
      conditions.push('rulemaking_id = @rulemaking_id');
      params.rulemaking_id = rulemaking_id;
    }

    if (status) {
      conditions.push('submission_status = @status');
      params.status = status;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT @limit OFFSET @offset`;
    params.limit = parseInt(limit);
    params.offset = parseInt(offset);

    const submissions = await db.query(sql, params);
    
    // Remove sensitive data
    const safeSubmissions = submissions.map(submission => {
      const { ip_address, user_agent, ...safeSubmission } = submission;
      return safeSubmission;
    });

    res.json({ submissions: safeSubmissions });
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/stats - Get submission statistics
router.get('/stats', async (req, res, next) => {
  try {
    const { rulemaking_id } = req.query;
    
    const datasetId = getDatasetId();
    let sql = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT user_name) as unique_users,
        COUNT(DISTINCT user_state) as states_represented,
        AVG(LENGTH(generated_comment)) as avg_comment_length,
        COUNT(CASE WHEN submission_status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN submission_status = 'draft' THEN 1 END) as draft_count
      FROM \`${datasetId}.submissions\`
    `;
    
    const params = {};
    if (rulemaking_id) {
      sql += ' WHERE rulemaking_id = @rulemaking_id';
      params.rulemaking_id = rulemaking_id;
    }

    const stats = await db.query(sql, params);
    res.json({ stats: stats[0] || {} });
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/export - Export submissions data (admin only)
router.get('/export', async (req, res, next) => {
  try {
    const { rulemaking_id, format = 'json' } = req.query;
    
    const datasetId = getDatasetId();
    let sql = `
      SELECT 
        s.*,
        r.title as rulemaking_title,
        r.agency,
        r.docket_id
      FROM \`${datasetId}.submissions\` s
      LEFT JOIN \`${datasetId}.rulemakings\` r ON s.rulemaking_id = r.id
    `;
    
    const params = {};
    if (rulemaking_id) {
      sql += ' WHERE s.rulemaking_id = @rulemaking_id';
      params.rulemaking_id = rulemaking_id;
    }
    
    sql += ' ORDER BY s.created_at DESC';

    const submissions = await db.query(sql, params);
    
    // Remove sensitive data
    const safeSubmissions = submissions.map(submission => {
      const { ip_address, user_agent, ...safeSubmission } = submission;
      return safeSubmission;
    });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(safeSubmissions[0] || {});
      const csvContent = [
        headers.join(','),
        ...safeSubmissions.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="submissions_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({ submissions: safeSubmissions });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
