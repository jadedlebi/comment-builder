const express = require('express');
const router = express.Router();
const AdminService = require('../services/adminService');

// Middleware to check if user is authenticated (simple token check)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Simple token validation (in production, use proper JWT validation)
  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [email] = decoded.split(':');
    req.user = { email };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get all admin users
router.get('/admins', authenticateToken, async (req, res) => {
  try {
    const result = await AdminService.getAllAdmins();
    
    if (result.success) {
      res.json({
        success: true,
        admins: result.admins
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new admin user
router.post('/admins', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await AdminService.createAdmin(email, password, name, role);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        admin: result.admin
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update admin user
router.put('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await AdminService.updateAdmin(id, updates);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change admin password
router.put('/admins/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    const result = await AdminService.changePassword(id, newPassword);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete admin user
router.delete('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await AdminService.deleteAdmin(id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
