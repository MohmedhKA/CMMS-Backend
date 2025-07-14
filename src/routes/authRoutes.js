const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, userSchemas } = require('../utils/validation');

const router = express.Router();

// Apply auth rate limiting to all routes
router.use(rateLimiters.auth);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', 
  validate(userSchemas.login),
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', 
  authController.refreshToken
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (only for authorized roles)
 * @access  Private (Leaders and Admin only)
 */
router.post('/register',
  authenticate,
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  validate(userSchemas.register),
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticate,
  validate(userSchemas.changePassword),
  handleValidationErrors,
  authController.changePassword
);

/**
 * @route   POST /api/auth/update-device-token
 * @desc    Update device token for push notifications
 * @access  Private
 */
router.post('/update-device-token',
  authenticate,
  validate(userSchemas.updateDeviceToken),
  handleValidationErrors,
  authController.updateDeviceToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify',
  authenticate,
  authController.verifyToken
);

/**
 * @route   GET /api/auth/permissions
 * @desc    Get user permissions
 * @access  Private
 */
router.get('/permissions',
  authenticate,
  authController.getPermissions
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset (future implementation)
 * @access  Public
 */
router.post('/request-password-reset',
  authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token (future implementation)
 * @access  Public
 */
router.post('/reset-password',
  authController.resetPassword
);

module.exports = router;

