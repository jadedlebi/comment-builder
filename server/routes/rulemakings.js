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

// GET /api/rulemakings - Get all active rulemakings
router.get('/', async (req, res, next) => {
  try {
    const datasetId = getDatasetId();
    const sql = `
      SELECT * FROM \`${datasetId}.rulemakings\` 
      WHERE status = 'active' 
      ORDER BY comment_deadline ASC
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
    const rulemaking = await db.getById('rulemakings', req.params.id);
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      opposition_points
    } = req.body;

    const rulemaking = {
      id: uuidv4(),
      agency,
      title,
      description,
      docket_id,
      federal_register_url,
      comment_deadline,
      status,
      context_documents: context_documents ? JSON.stringify(context_documents) : null,
      legal_analysis,
      opposition_points: opposition_points ? JSON.stringify(opposition_points) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.insert('rulemakings', [rulemaking]);
    res.status(201).json({ rulemaking });
  } catch (error) {
    next(error);
  }
});

// PUT /api/rulemakings/:id - Update rulemaking (admin only)
router.put('/:id', validateRulemaking, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const existingRulemaking = await db.getById('rulemakings', req.params.id);
    if (!existingRulemaking) {
      return res.status(404).json({ error: 'Rulemaking not found' });
    }

    const updates = { ...req.body };
    if (updates.context_documents) {
      updates.context_documents = JSON.stringify(updates.context_documents);
    }
    if (updates.opposition_points) {
      updates.opposition_points = JSON.stringify(updates.opposition_points);
    }

    await db.update('rulemakings', req.params.id, updates);
    const updatedRulemaking = await db.getById('rulemakings', req.params.id);
    res.json({ rulemaking: updatedRulemaking });
  } catch (error) {
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
