const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.details || err.message;
  }

  // BigQuery errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('bigquery')) {
    error.status = 500;
    error.message = 'Database Error';
    error.details = 'An error occurred while processing your request';
  }

  // Claude API errors
  if (err.response && err.response.status) {
    error.status = err.response.status;
    error.message = 'AI Service Error';
    error.details = 'Unable to generate comment at this time';
  }

  // Rate limit errors
  if (err.status === 429) {
    error.message = 'Too Many Requests';
    error.details = 'Please wait before making another request';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (error.status >= 500) {
      error.message = 'Internal Server Error';
      error.details = undefined;
    }
  }

  res.status(error.status).json({
    error: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
