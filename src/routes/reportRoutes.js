const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, reportSchemas } = require('../utils/validation');
const { createUploadMiddleware, validateFile } = require('../middleware/fileUpload');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All report routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/reports
 * @desc    Create new report
 * @access  Private (All authenticated users)
 */
router.post('/',
  rateLimiters.reportCreation,
  createUploadMiddleware('reportImage', 'image'),
  validate(reportSchemas.createReport),
  handleValidationErrors,
  reportController.createReport
);

/**
 * @route   GET /api/reports
 * @desc    Get all reports with filtering and pagination
 * @access  Private (Role-based filtering)
 */
router.get('/',
  reportController.getAllReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private (Role-based access)
 */
router.get('/:id',
  reportController.getReportById
);

/**
 * @route   GET /api/reports/reporter/:id
 * @desc    Get reports by reporter
 * @access  Private (Own reports or Leaders/Admin)
 */
router.get('/reporter/:id',
  reportController.getReportsByReporter
);

/**
 * @route   GET /api/reports/unassigned
 * @desc    Get unassigned reports
 * @access  Private (Technicians and Leaders)
 */
router.get('/unassigned',
  requireRole(['technician', 'technician_leader', 'admin']),
  reportController.getUnassignedReports
);

/**
 * @route   GET /api/reports/due-today
 * @desc    Get reports due today
 * @access  Private (Technicians and Leaders)
 */
router.get('/due-today',
  requireRole(['technician', 'technician_leader', 'admin']),
  reportController.getReportsDueToday
);

/**
 * @route   GET /api/reports/escalated
 * @desc    Get escalated reports
 * @access  Private (Leaders and Admin)
 */
router.get('/escalated',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.getEscalatedReports
);

/**
 * @route   GET /api/reports/overdue
 * @desc    Get overdue reports
 * @access  Private (Leaders and Admin)
 */
router.get('/overdue',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.getOverdueReports
);

/**
 * @route   PUT /api/reports/:id/assign
 * @desc    Assign report to technician
 * @access  Private (Leaders and Admin)
 */
router.put('/:id/assign',
  requireRole(['technician_leader', 'admin']),
  validate(reportSchemas.assignReport),
  handleValidationErrors,
  reportController.assignReport
);

/**
 * @route   PUT /api/reports/:id/claim
 * @desc    Claim unassigned report (technician claims report)
 * @access  Private (Technicians only)
 */
router.put('/:id/claim',
  requireRole(['technician']),
  reportController.claimReport
);

/**
 * @route   PUT /api/reports/:id/status
 * @desc    Update report status
 * @access  Private (Assigned technician or Leaders)
 */
router.put('/:id/status',
  validate(reportSchemas.updateStatus),
  handleValidationErrors,
  reportController.updateReportStatus
);

/**
 * @route   POST /api/reports/:id/team
 * @desc    Add team member to report (call for help)
 * @access  Private (Assigned technician or Leaders)
 */
router.post('/:id/team',
  validate(reportSchemas.addTeamMember),
  handleValidationErrors,
  reportController.addTeamMember
);

/**
 * @route   DELETE /api/reports/:id/team/:technicianId
 * @desc    Remove team member from report
 * @access  Private (Assigned technician or Leaders)
 */
router.delete('/:id/team/:technicianId',
  reportController.removeTeamMember
);

/**
 * @route   GET /api/reports/:id/team
 * @desc    Get report team members
 * @access  Private (Team members or Leaders)
 */
router.get('/:id/team',
  reportController.getReportTeam
);

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private (Leaders and Admin)
 */
router.get('/stats',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.getReportStats
);

/**
 * @route   PUT /api/reports/:id
 * @desc    Update report details
 * @access  Private (Reporter or Leaders)
 */
router.put('/:id',
  createUploadMiddleware('reportImage', 'image'),
  validate(reportSchemas.updateReport),
  handleValidationErrors,
  reportController.updateReport
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report (soft delete)
 * @access  Private (Reporter or Admin)
 */
router.delete('/:id',
  reportController.deleteReport
);

/**
 * @route   GET /api/reports/sector/:sector
 * @desc    Get reports by sector
 * @access  Private (All authenticated users)
 */
router.get('/sector/:sector',
  reportController.getReportsBySector
);

/**
 * @route   GET /api/reports/machine/:machineId
 * @desc    Get reports by machine
 * @access  Private (All authenticated users)
 */
router.get('/machine/:machineId',
  reportController.getReportsByMachine
);

/**
 * @route   POST /api/reports/:id/escalate
 * @desc    Manually escalate report
 * @access  Private (Assigned technician or Leaders)
 */
router.post('/:id/escalate',
  reportController.escalateReport
);

/**
 * @route   POST /api/reports/:id/archive
 * @desc    Archive completed report
 * @access  Private (Leaders and Admin)
 */
router.post('/:id/archive',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.archiveReport
);

/**
 * @route   GET /api/reports/export
 * @desc    Export reports data
 * @access  Private (Leaders and Admin)
 */
router.get('/export',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.exportReports
);

/**
 * @route   POST /api/reports/bulk-assign
 * @desc    Bulk assign reports
 * @access  Private (Leaders and Admin)
 */
router.post('/bulk-assign',
  requireRole(['technician_leader', 'admin']),
  validate(reportSchemas.bulkAssign),
  handleValidationErrors,
  reportController.bulkAssignReports
);

/**
 * @route   GET /api/reports/analytics/dashboard
 * @desc    Get reports dashboard analytics
 * @access  Private (Leaders and Admin)
 */
router.get('/analytics/dashboard',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  reportController.getReportsDashboard
);

module.exports = router;

