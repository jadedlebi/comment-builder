const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

const commentRoutes = require('./routes/comments');
const rulemakingRoutes = require('./routes/rulemakings');
const submissionRoutes = require('./routes/submissions');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middleware/errorHandler');
const { validateEnv } = require('./utils/envValidator');

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting (disabled for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 0 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // disable rate limiting in development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => process.env.NODE_ENV === 'development' // skip rate limiting in development
});

// Apply rate limiting with debug info
app.use('/api/', (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔓 Development mode: Rate limiting disabled for ${req.method} ${req.path}`);
  }
  limiter(req, res, next);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/comments', commentRoutes);
app.use('/api/rulemakings', rulemakingRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
