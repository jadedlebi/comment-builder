const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { db, getDatasetId } = require('../config/bigquery');

const router = express.Router();

// Validation middleware
const validateRulemaking = [
  body('agency').notEmpty().withMessage('Agency is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('docket_id').notEmpty().withMessage('Docket ID is required'),
  body('comment_deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('status').isIn(['active', 'closed', 'draft']).withMessage('Status must be active, closed, or draft')
];

// GET /api/rulemakings - Get all active rulemakings (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const datasetId = getDatasetId();
    const now = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT r.* FROM \`${datasetId}.rulemakings\` r
      LEFT JOIN \`${datasetId}.deleted_rulemakings\` d ON r.id = d.id
      WHERE r.status = 'active' 
      AND r.comment_deadline >= @now
      AND d.id IS NULL
      ORDER BY r.comment_deadline ASC
    `;
    const rulemakings = await db.query(sql, { now });
    res.json({ rulemakings });
  } catch (error) {
    next(error);
  }
});

// GET /api/rulemakings/admin - Get all rulemakings including expired ones (admin only)
router.get('/admin', async (req, res, next) => {
  try {
    const datasetId = getDatasetId();
    const sql = `
      SELECT r.* FROM \`${datasetId}.rulemakings\` r
      LEFT JOIN \`${datasetId}.deleted_rulemakings\` d ON r.id = d.id
      WHERE d.id IS NULL
      ORDER BY r.comment_deadline ASC
    `;
    const rulemakings = await db.query(sql);
    res.json({ rulemakings });
  } catch (error) {
    next(error);
  }
});

// GET /api/rulemakings/:id - Get specific rulemaking
router.get('/:id', async (req, res, next) => {
  try {
    const datasetId = getDatasetId();
    const sql = `
      SELECT r.* FROM \`${datasetId}.rulemakings\` r
      LEFT JOIN \`${datasetId}.deleted_rulemakings\` d ON r.id = d.id
      WHERE r.id = @id AND d.id IS NULL
    `;
    const rows = await db.query(sql, { id: req.params.id });
    const rulemaking = rows[0] || null;
    
    if (!rulemaking) {
      return res.status(404).json({ error: 'Rulemaking not found' });
    }
    res.json({ rulemaking });
  } catch (error) {
    next(error);
  }
});

// POST /api/rulemakings - Create new rulemaking (admin only)
router.post('/', validateRulemaking, async (req, res, next) => {
  try {
    console.log('🔍 POST /api/rulemakings - Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      agency,
      title,
      description,
      docket_id,
      federal_register_url,
      comment_deadline,
      status = 'active',
      context_documents,
      legal_analysis,
      opposition_points,
      ncrc_comment_letter
    } = req.body;

    // Convert comment_deadline from ISO string to DATE format for BigQuery
    let formattedCommentDeadline = comment_deadline;
    if (comment_deadline) {
      const date = new Date(comment_deadline);
      formattedCommentDeadline = date.toISOString().split('T')[0];
      console.log('🔍 Converted comment_deadline:', formattedCommentDeadline);
    }

    console.log('🔍 Parsed data:', {
      agency,
      title,
      description,
      docket_id,
      federal_register_url,
      comment_deadline: formattedCommentDeadline,
      status,
      context_documents,
      legal_analysis,
      opposition_points,
      ncrc_comment_letter
    });

    const rulemaking = {
      id: uuidv4(),
      agency,
      title,
      description,
      docket_id,
      federal_register_url,
      comment_deadline: formattedCommentDeadline,
      status,
      context_documents: context_documents ? JSON.stringify(context_documents) : null,
      legal_analysis,
      opposition_points: opposition_points ? JSON.stringify(opposition_points) : null,
      ncrc_comment_letter,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔍 Rulemaking object to insert:', JSON.stringify(rulemaking, null, 2));

    await db.insert('rulemakings', [rulemaking]);
    console.log('✅ Successfully inserted rulemaking');
    res.status(201).json({ rulemaking });
  } catch (error) {
    console.error('❌ Error in POST /api/rulemakings:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
});

// PUT /api/rulemakings/:id - Update rulemaking (admin only)
router.put('/:id', validateRulemaking, async (req, res, next) => {
  try {
    console.log('🔍 PUT /api/rulemakings - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 PUT /api/rulemakings - Rulemaking ID:', req.params.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const existingRulemaking = await db.getById('rulemakings', req.params.id);
    if (!existingRulemaking) {
      console.log('❌ Rulemaking not found:', req.params.id);
      return res.status(404).json({ error: 'Rulemaking not found' });
    }

    const updates = { ...req.body };
    
    // Convert comment_deadline from ISO string to DATE format for BigQuery
    if (updates.comment_deadline) {
      // Convert ISO string to YYYY-MM-DD format for BigQuery DATE type
      const date = new Date(updates.comment_deadline);
      updates.comment_deadline = date.toISOString().split('T')[0];
      console.log('🔍 Converted comment_deadline:', updates.comment_deadline);
    }
    
    if (updates.context_documents) {
      updates.context_documents = JSON.stringify(updates.context_documents);
    }
    if (updates.opposition_points) {
      updates.opposition_points = JSON.stringify(updates.opposition_points);
    }

    console.log('🔍 Updates to apply:', JSON.stringify(updates, null, 2));
    
    await db.update('rulemakings', req.params.id, updates);
    const updatedRulemaking = await db.getById('rulemakings', req.params.id);
    console.log('✅ Successfully updated rulemaking');
    res.json({ rulemaking: updatedRulemaking });
  } catch (error) {
    console.error('❌ Error in PUT /api/rulemakings:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
});

// DELETE /api/rulemakings/:id - Delete rulemaking (admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    console.log('🔍 DELETE /api/rulemakings - Rulemaking ID:', req.params.id);
    
    const existingRulemaking = await db.getById('rulemakings', req.params.id);
    if (!existingRulemaking) {
      console.log('❌ Rulemaking not found:', req.params.id);
      return res.status(404).json({ error: 'Rulemaking not found' });
    }

    console.log('🔍 Deleting rulemaking:', existingRulemaking.title);
    
    // Move to deleted_rulemakings table
    await db.delete('rulemakings', req.params.id, req.user?.email || 'admin');
    console.log('✅ Successfully moved rulemaking to deleted table');
    
    res.json({ 
      message: 'Rulemaking deleted successfully',
      deletedId: req.params.id
    });
  } catch (error) {
    console.error('❌ Error in DELETE /api/rulemakings:', error);
    console.error('❌ Error stack:', error.stack);
    next(error);
  }
});

// GET /api/rulemakings/:id/analytics - Get analytics for a rulemaking
router.get('/:id/analytics', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await db.getAnalytics(
      req.params.id,
      startDate || '2024-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );
    res.json({ analytics: analytics[0] || {} });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
