const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, userSchemas } = require('../utils/validation');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Leaders and Admin only)
 */
router.get('/',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Leaders/Admin)
 */
router.get('/:id',
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Own profile or Leaders/Admin)
 */
router.put('/:id',
  validate(userSchemas.updateUser),
  handleValidationErrors,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Leaders and Admin only)
 */
router.delete('/:id',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.deleteUser
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private (Leaders and Admin only)
 */
router.get('/role/:role',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.getUsersByRole
);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/:id/stats',
  userController.getUserStats
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private (Leaders and Admin only)
 */
router.get('/search',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.searchUsers
);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user account
 * @access  Private (Leaders and Admin only)
 */
router.put('/:id/activate',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.activateUser
);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Leaders and Admin only)
 */
router.put('/:id/deactivate',
  requireRole(['workers_leader', 'technician_leader', 'admin']),
  userController.deactivateUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.put('/:id/role',
  requireRole(['admin']),
  validate(userSchemas.updateRole),
  handleValidationErrors,
  userController.updateUserRole
);

/**
 * @route   GET /api/users/:id/reports
 * @desc    Get user's reports
 * @access  Private (Own reports or Leaders/Admin)
 */
router.get('/:id/reports',
  userController.getUserReports
);

/**
 * @route   GET /api/users/:id/assignments
 * @desc    Get user's current assignments
 * @access  Private (Own assignments or Leaders/Admin)
 */
router.get('/:id/assignments',
  userController.getUserAssignments
);

/**
 * @route   POST /api/users/bulk-create
 * @desc    Bulk create users
 * @access  Private (Admin only)
 */
router.post('/bulk-create',
  requireRole(['admin']),
  validate(userSchemas.bulkCreate),
  handleValidationErrors,
  userController.bulkCreateUsers
);

/**
 * @route   GET /api/users/export
 * @desc    Export users data
 * @access  Private (Admin only)
 */
router.get('/export',
  requireRole(['admin']),
  userController.exportUsers
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id/reset-password',
  requireRole(['admin']),
  userController.resetUserPassword
);

module.exports = router;

