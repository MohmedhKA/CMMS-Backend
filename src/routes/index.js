const express = require('express');
const cors = require('cors');
const { corsOptions } = require('../middleware/security');

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const reportRoutes = require('./reportRoutes');
const machineRoutes = require('./machineRoutes');
const partRoutes = require('./partRoutes');
const technicianStatsRoutes = require('./technicianStatsRoutes');
const fileRoutes = require('./fileRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

// Apply CORS to all routes
router.use(cors(corsOptions));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CMMS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CMMS API',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      reports: '/api/reports/*',
      machines: '/api/machines/*',
      parts: '/api/parts/*',
      stats: '/api/stats/*',
      files: '/api/files/*',
      admin: '/api/admin/*'
    },
    endpoints: {
      health: 'GET /api/health',
      docs: 'GET /api/docs'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/machines', machineRoutes);
router.use('/parts', partRoutes);
router.use('/stats', technicianStatsRoutes);
router.use('/files', fileRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

