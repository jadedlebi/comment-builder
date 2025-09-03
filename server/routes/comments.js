const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const claudeService = require('../utils/claudeService');
const { db } = require('../config/bigquery');

const router = express.Router();

// Validation middleware
const validateCommentRequest = [
  body('rulemaking_id').notEmpty().withMessage('Rulemaking ID is required'),
  body('user_name').notEmpty().withMessage('Name is required'),
  body('recaptcha_token').notEmpty().withMessage('reCAPTCHA verification is required')
];

// POST /api/comments/generate - Generate a comment letter
router.post('/generate', validateCommentRequest, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      rulemaking_id,
      user_name,
      user_email,
      user_city,
      user_state,
      user_zip,
      personal_story,
      why_it_matters,
      experiences,
      concerns,
      recaptcha_token
    } = req.body;

    // Verify reCAPTCHA
    const recaptchaVerified = await verifyRecaptcha(recaptcha_token);
    if (!recaptchaVerified) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    // Get rulemaking data
    const rulemaking = await db.getById('rulemakings', rulemaking_id);
    if (!rulemaking) {
      return res.status(404).json({ error: 'Rulemaking not found' });
    }

    if (rulemaking.status !== 'active') {
      return res.status(400).json({ error: 'This rulemaking is no longer accepting comments' });
    }

    // Prepare user data
    const userData = {
      name: user_name,
      email: user_email,
      city: user_city,
      state: user_state,
      zip: user_zip,
      personal_story,
      why_it_matters,
      experiences,
      concerns
    };

    // Generate comment using Claude
    const generatedComment = await claudeService.generateComment(rulemaking, userData);

    // Save submission to database
    const submissionId = uuidv4();
    const submission = {
      id: submissionId,
      rulemaking_id,
      user_name,
      user_email,
      user_city,
      user_state,
      user_zip,
      personal_story,
      why_it_matters,
      experiences,
      concerns,
      generated_comment: generatedComment,
      submission_status: 'draft',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      recaptcha_verified: true,
      created_at: new Date().toISOString()
    };

    await db.insert('submissions', [submission]);

    res.json({
      submission_id: submissionId,
      generated_comment: generatedComment,
      rulemaking: {
        title: rulemaking.title,
        agency: rulemaking.agency,
        docket_id: rulemaking.docket_id,
        federal_register_url: rulemaking.federal_register_url,
        comment_deadline: rulemaking.comment_deadline
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/comments/:id - Update a comment (save final version)
router.put('/:id', [
  body('final_comment').notEmpty().withMessage('Final comment is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { final_comment, submission_status = 'submitted' } = req.body;
    const submissionId = req.params.id;

    // Check if submission exists
    const existingSubmission = await db.getById('submissions', submissionId);
    if (!existingSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update submission
    const updates = {
      final_comment,
      submission_status,
      submitted_at: submission_status === 'submitted' ? new Date().toISOString() : null
    };

    await db.update('submissions', submissionId, updates);

    // Update analytics
    await updateAnalytics(existingSubmission.rulemaking_id);

    res.json({ 
      message: 'Comment updated successfully',
      submission_id: submissionId 
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:id - Get a specific comment
router.get('/:id', async (req, res, next) => {
  try {
    const submission = await db.getById('submissions', req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Don't return sensitive data
    const { ip_address, user_agent, ...safeSubmission } = submission;
    res.json({ submission: safeSubmission });
  } catch (error) {
    next(error);
  }
});

// Helper function to verify reCAPTCHA
async function verifyRecaptcha(token) {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('reCAPTCHA secret key not configured, skipping verification');
    return true; // Allow in development
  }

  // Skip reCAPTCHA verification in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: skipping reCAPTCHA verification');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const data = await response.json();
    console.log('reCAPTCHA verification response:', data);
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// Helper function to update analytics
async function updateAnalytics(rulemakingId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if analytics record exists for today
    const existingAnalytics = await db.query(`
      SELECT * FROM \`${db.datasetId}.analytics\` 
      WHERE date = @date AND rulemaking_id = @rulemakingId
    `, { date: today, rulemakingId });

    if (existingAnalytics.length > 0) {
      // Update existing record
      const analytics = await db.getAnalytics(rulemakingId, today, today);
      await db.update('analytics', existingAnalytics[0].id, {
        total_submissions: analytics[0].total_submissions,
        unique_users: analytics[0].unique_users,
        states_represented: analytics[0].states_represented,
        avg_comment_length: analytics[0].avg_comment_length
      });
    } else {
      // Create new record
      const analytics = await db.getAnalytics(rulemakingId, today, today);
      const analyticsRecord = {
        id: uuidv4(),
        date: today,
        rulemaking_id: rulemakingId,
        total_submissions: analytics[0].total_submissions || 0,
        unique_users: analytics[0].unique_users || 0,
        states_represented: analytics[0].states_represented || 0,
        avg_comment_length: analytics[0].avg_comment_length || 0,
        created_at: new Date().toISOString()
      };
      await db.insert('analytics', [analyticsRecord]);
    }
  } catch (error) {
    console.error('Analytics update error:', error);
    // Don't throw - analytics failure shouldn't break the main flow
  }
}

module.exports = router;
