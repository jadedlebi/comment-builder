const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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

// Trust proxy for Cloud Run (fixes rate limiting issue)
app.set('trust proxy', 1);

// Security middleware with CSP configuration for reCAPTCHA
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React
        "https://www.google.com", // reCAPTCHA scripts
        "https://www.gstatic.com" // reCAPTCHA static resources
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React inline styles
        "https://fonts.googleapis.com" // Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com" // Google Fonts
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://www.google.com" // reCAPTCHA images
      ],
      connectSrc: [
        "'self'",
        "https://www.google.com" // reCAPTCHA API calls
      ]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow your deployed frontend
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    
    // Allow the service's own domain (for admin dashboard)
    if (origin === 'https://comment-builder-892833260112.us-east1.run.app') {
      return callback(null, true);
    }
    
    // Allow your WordPress domain
    if (origin === 'https://ncrc.org' || origin === 'https://www.ncrc.org') {
      return callback(null, true);
    }
    
    // Allow any subdomain of ncrc.org for embeddable widgets
    if (origin.match(/^https:\/\/[a-zA-Z0-9-]+\.ncrc\.org$/)) {
      return callback(null, true);
    }
    
    // Allow GitHub Pages domains for widget hosting
    if (origin.match(/^https:\/\/[a-zA-Z0-9-]+\.github\.io$/)) {
      return callback(null, true);
    }
    
    // In production, be more restrictive
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow all origins
    return callback(null, true);
  },
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

// Serve static files from the React app build
app.use(express.static('public'));

// API routes
app.use('/api/comments', commentRoutes);
app.use('/api/rulemakings', rulemakingRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});

module.exports = app;
