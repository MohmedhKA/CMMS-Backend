const express = require('express');
const machineController = require('../controllers/machineController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, machineSchemas } = require('../utils/validation');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All machine routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/machines
 * @desc    Create new machine
 * @access  Private (Leaders and Admin only)
 */
router.post('/',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(machineSchemas.createMachine),
  handleValidationErrors,
  machineController.createMachine
);

/**
 * @route   GET /api/machines
 * @desc    Get all machines with pagination and filtering
 * @access  Private (All authenticated users)
 */
router.get('/',
  machineController.getAllMachines
);

/**
 * @route   GET /api/machines/:id
 * @desc    Get machine by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id',
  machineController.getMachineById
);

/**
 * @route   GET /api/machines/qr/:qr_code
 * @desc    Get machine by QR code
 * @access  Private (All authenticated users)
 */
router.get('/qr/:qr_code',
  machineController.getMachineByQRCode
);

/**
 * @route   GET /api/machines/sector/:sector
 * @desc    Get machines by sector
 * @access  Private (All authenticated users)
 */
router.get('/sector/:sector',
  machineController.getMachinesBySector
);

/**
 * @route   GET /api/machines/grid/:grid_location
 * @desc    Get machines by grid location
 * @access  Private (All authenticated users)
 */
router.get('/grid/:grid_location',
  machineController.getMachinesByGridLocation
);

/**
 * @route   PUT /api/machines/:id
 * @desc    Update machine
 * @access  Private (Leaders and Admin only)
 */
router.put('/:id',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(machineSchemas.updateMachine),
  handleValidationErrors,
  machineController.updateMachine
);

/**
 * @route   DELETE /api/machines/:id
 * @desc    Delete machine
 * @access  Private (Admin only)
 */
router.delete('/:id',
  requireRole(['admin']),
  machineController.deleteMachine
);

/**
 * @route   GET /api/machines/search
 * @desc    Search machines
 * @access  Private (All authenticated users)
 */
router.get('/search',
  rateLimiters.search,
  machineController.searchMachines
);

/**
 * @route   GET /api/machines/stats
 * @desc    Get machine statistics
 * @access  Private (Leaders and Admin)
 */
router.get('/stats',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  machineController.getMachineStats
);

/**
 * @route   GET /api/machines/reports/counts
 * @desc    Get machines with report counts
 * @access  Private (Leaders and Admin)
 */
router.get('/reports/counts',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  machineController.getMachinesWithReportCounts
);

/**
 * @route   GET /api/machines/sectors/unique
 * @desc    Get unique sectors
 * @access  Private (All authenticated users)
 */
router.get('/sectors/unique',
  machineController.getUniqueSectors
);

/**
 * @route   GET /api/machines/grid-locations/unique
 * @desc    Get unique grid locations
 * @access  Private (All authenticated users)
 */
router.get('/grid-locations/unique',
  machineController.getUniqueGridLocations
);

/**
 * @route   POST /api/machines/bulk
 * @desc    Bulk create machines
 * @access  Private (Admin only)
 */
router.post('/bulk',
  requireRole(['admin']),
  validate(machineSchemas.bulkCreate),
  handleValidationErrors,
  machineController.bulkCreateMachines
);

/**
 * @route   POST /api/machines/:id/qr-code
 * @desc    Generate QR code for machine
 * @access  Private (Leaders and Admin)
 */
router.post('/:id/qr-code',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  machineController.generateQRCode
);

/**
 * @route   POST /api/machines/validate-qr
 * @desc    Validate QR code
 * @access  Private (All authenticated users)
 */
router.post('/validate-qr',
  validate(machineSchemas.validateQR),
  handleValidationErrors,
  machineController.validateQRCode
);

/**
 * @route   GET /api/machines/:id/reports
 * @desc    Get reports for specific machine
 * @access  Private (All authenticated users)
 */
router.get('/:id/reports',
  machineController.getMachineReports
);

/**
 * @route   GET /api/machines/:id/maintenance-history
 * @desc    Get maintenance history for machine
 * @access  Private (All authenticated users)
 */
router.get('/:id/maintenance-history',
  machineController.getMaintenanceHistory
);

/**
 * @route   PUT /api/machines/:id/status
 * @desc    Update machine status
 * @access  Private (Technicians and Leaders)
 */
router.put('/:id/status',
  requireRole(['technician', 'technician_leader', 'admin']),
  validate(machineSchemas.updateStatus),
  handleValidationErrors,
  machineController.updateMachineStatus
);

/**
 * @route   GET /api/machines/export
 * @desc    Export machines data
 * @access  Private (Admin only)
 */
router.get('/export',
  requireRole(['admin']),
  machineController.exportMachines
);

/**
 * @route   POST /api/machines/import
 * @desc    Import machines from CSV
 * @access  Private (Admin only)
 */
router.post('/import',
  requireRole(['admin']),
  machineController.importMachines
);

/**
 * @route   GET /api/machines/:id/analytics
 * @desc    Get machine analytics
 * @access  Private (Leaders and Admin)
 */
router.get('/:id/analytics',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  machineController.getMachineAnalytics
);

module.exports = router;

