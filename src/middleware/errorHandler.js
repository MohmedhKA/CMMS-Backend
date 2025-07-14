const { securityLogger } = require('./security');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = new ValidationError('Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const field = err.detail?.match(/Key \((.+)\)=/)?.[1] || 'field';
    error = new ConflictError(`${field} already exists`);
  }

  if (err.code === '23503') { // Foreign key violation
    error = new AppError('Referenced resource does not exist', 400);
  }

  if (err.code === '23502') { // Not null violation
    const field = err.column || 'field';
    error = new ValidationError(`${field} is required`);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 413);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field', 400);
  }

  // Rate limiting errors
  if (err.type === 'entity.too.large') {
    error = new AppError('Request entity too large', 413);
  }

  // Security-related errors
  if (err.message?.includes('SQL injection') || 
      err.message?.includes('XSS') || 
      err.message?.includes('malicious')) {
    securityLogger.logSecurityEvent('SECURITY_ERROR', {
      error: err.message,
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    error = new AppError('Security violation detected', 400);
  }

  // Send error response
  sendErrorResponse(error, req, res);
};

// Send error response based on environment
const sendErrorResponse = (err, req, res) => {
  const { statusCode = 500, message, isOperational = false } = err;

  // Operational errors: send error details to client
  if (isOperational) {
    const response = {
      success: false,
      message,
      ...(err.errors && { errors: err.errors })
    };

    // Add additional details in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.error = err;
    }

    return res.status(statusCode).json(response);
  }

  // Programming errors: don't leak error details
  console.error('PROGRAMMING ERROR:', err);

  // Log critical errors for monitoring
  if (statusCode >= 500) {
    securityLogger.logSecurityEvent('CRITICAL_ERROR', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    });
  }

  const response = {
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : message || 'Something went wrong'
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Unhandled promise rejection handler
const unhandledRejectionHandler = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    securityLogger.logSecurityEvent('UNHANDLED_REJECTION', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

// Uncaught exception handler
const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    securityLogger.logSecurityEvent('UNCAUGHT_EXCEPTION', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

// Graceful shutdown handler
const gracefulShutdownHandler = (server) => {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Database error handler
const handleDatabaseError = (err, req, res, next) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection refused');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable'
    });
  }

  if (err.code === 'ENOTFOUND') {
    console.error('Database host not found');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable'
    });
  }

  if (err.code === 'ETIMEDOUT') {
    console.error('Database connection timeout');
    return res.status(503).json({
      success: false,
      message: 'Database service timeout'
    });
  }

  next(err);
};

// Request timeout handler
const requestTimeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new AppError('Request timeout', 408);
      next(error);
    });
    next();
  };
};

// Memory usage monitor
const memoryMonitor = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Log warning if memory usage is high
    if (memUsageMB.heapUsed > 500) { // 500MB threshold
      console.warn('High memory usage detected:', memUsageMB);
      securityLogger.logSecurityEvent('HIGH_MEMORY_USAGE', memUsageMB);
    }
  }, 60000); // Check every minute
};

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    message: error.message || 'An error occurred',
    timestamp: new Date().toISOString()
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  
  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleDatabaseError,
  requestTimeoutHandler,
  
  // Handlers
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  gracefulShutdownHandler,
  
  // Utilities
  sendErrorResponse,
  formatErrorResponse,
  memoryMonitor
};

