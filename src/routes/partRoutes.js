const express = require('express');
const partController = require('../controllers/partController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, partSchemas } = require('../utils/validation');
const { createUploadMiddleware } = require('../middleware/fileUpload');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All part routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/parts
 * @desc    Create new part
 * @access  Private (Leaders and Admin only)
 */
router.post('/',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  createUploadMiddleware('partDocument', 'document'),
  validate(partSchemas.createPart),
  handleValidationErrors,
  partController.createPart
);

/**
 * @route   GET /api/parts
 * @desc    Get all parts with pagination and filtering
 * @access  Private (All authenticated users)
 */
router.get('/',
  partController.getAllParts
);

/**
 * @route   GET /api/parts/:id
 * @desc    Get part by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id',
  partController.getPartById
);

/**
 * @route   GET /api/parts/part-number/:part_number
 * @desc    Get part by part number
 * @access  Private (All authenticated users)
 */
router.get('/part-number/:part_number',
  partController.getPartByPartNumber
);

/**
 * @route   GET /api/parts/search
 * @desc    Search parts
 * @access  Private (All authenticated users)
 */
router.get('/search',
  rateLimiters.search,
  partController.searchParts
);

/**
 * @route   GET /api/parts/category/:category
 * @desc    Get parts by category
 * @access  Private (All authenticated users)
 */
router.get('/category/:category',
  partController.getPartsByCategory
);

/**
 * @route   GET /api/parts/low-stock
 * @desc    Get low stock parts
 * @access  Private (Technicians and Leaders)
 */
router.get('/low-stock',
  requireRole(['technician', 'technician_leader', 'workers_leader', 'admin']),
  partController.getLowStockParts
);

/**
 * @route   PUT /api/parts/:id
 * @desc    Update part
 * @access  Private (Leaders and Admin only)
 */
router.put('/:id',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  createUploadMiddleware('partDocument', 'document'),
  validate(partSchemas.updatePart),
  handleValidationErrors,
  partController.updatePart
);

/**
 * @route   PUT /api/parts/:id/stock
 * @desc    Update part stock
 * @access  Private (Technicians and Leaders)
 */
router.put('/:id/stock',
  requireRole(['technician', 'technician_leader', 'workers_leader', 'admin']),
  validate(partSchemas.updateStock),
  handleValidationErrors,
  partController.updatePartStock
);

/**
 * @route   DELETE /api/parts/:id
 * @desc    Delete part (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  requireRole(['admin']),
  partController.deletePart
);

/**
 * @route   GET /api/parts/categories
 * @desc    Get part categories
 * @access  Private (All authenticated users)
 */
router.get('/categories',
  partController.getCategories
);

/**
 * @route   GET /api/parts/manufacturers
 * @desc    Get part manufacturers
 * @access  Private (All authenticated users)
 */
router.get('/manufacturers',
  partController.getManufacturers
);

/**
 * @route   GET /api/parts/stats
 * @desc    Get part statistics
 * @access  Private (Leaders and Admin)
 */
router.get('/stats',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.getPartStats
);

/**
 * @route   PUT /api/parts/bulk-stock
 * @desc    Bulk update stock
 * @access  Private (Leaders and Admin)
 */
router.put('/bulk-stock',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(partSchemas.bulkUpdateStock),
  handleValidationErrors,
  partController.bulkUpdateStock
);

// Part Requests Routes

/**
 * @route   POST /api/parts/requests
 * @desc    Create part request
 * @access  Private (Technicians only)
 */
router.post('/requests',
  requireRole(['technician']),
  validate(partSchemas.createRequest),
  handleValidationErrors,
  partController.createPartRequest
);

/**
 * @route   GET /api/parts/requests
 * @desc    Get all part requests
 * @access  Private (Role-based filtering)
 */
router.get('/requests',
  partController.getAllPartRequests
);

/**
 * @route   GET /api/parts/requests/:id
 * @desc    Get part request by ID
 * @access  Private (Own request or Leaders/Admin)
 */
router.get('/requests/:id',
  partController.getPartRequestById
);

/**
 * @route   GET /api/parts/requests/technician/:id
 * @desc    Get part requests by technician
 * @access  Private (Own requests or Leaders/Admin)
 */
router.get('/requests/technician/:id',
  partController.getPartRequestsByTechnician
);

/**
 * @route   PUT /api/parts/requests/:id/status
 * @desc    Approve/reject part request
 * @access  Private (Leaders and Admin only)
 */
router.put('/requests/:id/status',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(partSchemas.updateRequestStatus),
  handleValidationErrors,
  partController.updatePartRequestStatus
);

/**
 * @route   PUT /api/parts/requests/:id/delivered
 * @desc    Mark part request as delivered
 * @access  Private (Leaders and Admin only)
 */
router.put('/requests/:id/delivered',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.markPartRequestDelivered
);

/**
 * @route   GET /api/parts/requests/pending
 * @desc    Get pending part requests
 * @access  Private (Leaders and Admin)
 */
router.get('/requests/pending',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.getPendingPartRequests
);

/**
 * @route   GET /api/parts/requests/approved
 * @desc    Get approved part requests
 * @access  Private (Leaders and Admin)
 */
router.get('/requests/approved',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.getApprovedPartRequests
);

/**
 * @route   POST /api/parts/bulk-create
 * @desc    Bulk create parts
 * @access  Private (Admin only)
 */
router.post('/bulk-create',
  requireRole(['admin']),
  validate(partSchemas.bulkCreate),
  handleValidationErrors,
  partController.bulkCreateParts
);

/**
 * @route   GET /api/parts/export
 * @desc    Export parts data
 * @access  Private (Leaders and Admin)
 */
router.get('/export',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.exportParts
);

/**
 * @route   POST /api/parts/import
 * @desc    Import parts from CSV
 * @access  Private (Admin only)
 */
router.post('/import',
  requireRole(['admin']),
  partController.importParts
);

/**
 * @route   GET /api/parts/:id/usage-history
 * @desc    Get part usage history
 * @access  Private (All authenticated users)
 */
router.get('/:id/usage-history',
  partController.getPartUsageHistory
);

/**
 * @route   GET /api/parts/analytics/consumption
 * @desc    Get parts consumption analytics
 * @access  Private (Leaders and Admin)
 */
router.get('/analytics/consumption',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  partController.getPartsConsumptionAnalytics
);

/**
 * @route   POST /api/parts/:id/reorder
 * @desc    Create reorder for part
 * @access  Private (Leaders and Admin)
 */
router.post('/:id/reorder',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(partSchemas.reorderPart),
  handleValidationErrors,
  partController.reorderPart
);

module.exports = router;

