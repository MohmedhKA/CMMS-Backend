const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

// Import middleware
const { 
  securityHeaders, 
  sanitizeInput, 
  preventSQLInjection, 
  requestSizeLimiter,
  requestLogger,
  corsOptions 
} = require('./middleware/security');

const { 
  errorHandler, 
  notFoundHandler, 
  handleDatabaseError,
  requestTimeoutHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  memoryMonitor
} = require('./middleware/errorHandler');

// Import services
const { testConnection } = require('./config/database');
const backgroundTasksService = require('./services/backgroundTasks');

// Import routes
const apiRoutes = require('./routes');

// Create Express app
const app = express();

// Set up error handlers for unhandled promises and exceptions
unhandledRejectionHandler();
uncaughtExceptionHandler();

// Start memory monitoring
memoryMonitor();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(securityHeaders));
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
  app.use(requestLogger);
}

// Compression middleware
app.use(compression());

// Request size limiting
app.use(requestSizeLimiter('10mb'));

// Request timeout
app.use(requestTimeoutHandler(30000)); // 30 seconds

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeInput);
app.use(preventSQLInjection);

// Static file serving for uploads
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Database error handling
app.use(handleDatabaseError);

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CMMS Backend API',
    version: '1.0.0',
    documentation: '/api',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database connection and background tasks
const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize background tasks
    backgroundTasksService.initialize();
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 CMMS Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  
  // Initialize application
  await initializeApp();
});

// Graceful shutdown
const { gracefulShutdownHandler } = require('./middleware/errorHandler');
gracefulShutdownHandler(server);

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  backgroundTasksService.stopAllTasks();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  backgroundTasksService.stopAllTasks();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;

