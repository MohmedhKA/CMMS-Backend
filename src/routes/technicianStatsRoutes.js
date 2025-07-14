const express = require('express');
const technicianStatsController = require('../controllers/technicianStatsController');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, statsSchemas } = require('../utils/validation');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All stats routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/stats/technician/:id
 * @desc    Get technician statistics
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/technician/:id',
  technicianStatsController.getStatsByTechnicianId
);

/**
 * @route   GET /api/stats/technician/:id/current
 * @desc    Get current month stats for technician
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/technician/:id/current',
  technicianStatsController.getCurrentMonthStats
);

/**
 * @route   GET /api/stats/time-period
 * @desc    Get stats by time period
 * @access  Private (Leaders and Admin)
 */
router.get('/time-period',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.timePeriod),
  handleValidationErrors,
  technicianStatsController.getStatsByTimePeriod
);

/**
 * @route   GET /api/stats/leaderboard
 * @desc    Get performance leaderboard
 * @access  Private (All authenticated users)
 */
router.get('/leaderboard',
  technicianStatsController.getLeaderboard
);

/**
 * @route   GET /api/stats/technician/:id/aggregated
 * @desc    Get aggregated stats for technician
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/technician/:id/aggregated',
  technicianStatsController.getAggregatedStats
);

/**
 * @route   GET /api/stats/sector-performance
 * @desc    Get sector performance
 * @access  Private (Leaders and Admin)
 */
router.get('/sector-performance',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.timePeriod),
  handleValidationErrors,
  technicianStatsController.getSectorPerformance
);

/**
 * @route   POST /api/stats/generate-monthly
 * @desc    Generate monthly stats (admin only)
 * @access  Private (Admin only)
 */
router.post('/generate-monthly',
  requireRole(['admin']),
  validate(statsSchemas.generateMonthly),
  handleValidationErrors,
  technicianStatsController.generateMonthlyStats
);

/**
 * @route   GET /api/stats/technician/:id/efficiency
 * @desc    Get efficiency metrics
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/technician/:id/efficiency',
  technicianStatsController.getEfficiencyMetrics
);

/**
 * @route   GET /api/stats/technician/:id/dashboard
 * @desc    Get technician dashboard data
 * @access  Private (Own dashboard or Leaders/Admin)
 */
router.get('/technician/:id/dashboard',
  technicianStatsController.getTechnicianDashboard
);

/**
 * @route   GET /api/stats/team-leader/dashboard
 * @desc    Get team leader dashboard data
 * @access  Private (Leaders and Admin)
 */
router.get('/team-leader/dashboard',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getTeamLeaderDashboard
);

/**
 * @route   GET /api/stats/comparison
 * @desc    Get performance comparison
 * @access  Private (Leaders and Admin)
 */
router.get('/comparison',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.comparison),
  handleValidationErrors,
  technicianStatsController.getPerformanceComparison
);

/**
 * @route   GET /api/stats/top-performers
 * @desc    Get top performers
 * @access  Private (All authenticated users)
 */
router.get('/top-performers',
  technicianStatsController.getTopPerformers
);

/**
 * @route   GET /api/stats/technician/:id/trends
 * @desc    Get technician performance trends
 * @access  Private (Own stats or Leaders/Admin)
 */
router.get('/technician/:id/trends',
  technicianStatsController.getPerformanceTrends
);

/**
 * @route   GET /api/stats/team-performance
 * @desc    Get team performance overview
 * @access  Private (Leaders and Admin)
 */
router.get('/team-performance',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getTeamPerformance
);

/**
 * @route   GET /api/stats/workload-distribution
 * @desc    Get workload distribution
 * @access  Private (Leaders and Admin)
 */
router.get('/workload-distribution',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getWorkloadDistribution
);

/**
 * @route   GET /api/stats/sla-performance
 * @desc    Get SLA performance metrics
 * @access  Private (Leaders and Admin)
 */
router.get('/sla-performance',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getSLAPerformance
);

/**
 * @route   GET /api/stats/productivity-metrics
 * @desc    Get productivity metrics
 * @access  Private (Leaders and Admin)
 */
router.get('/productivity-metrics',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getProductivityMetrics
);

/**
 * @route   GET /api/stats/export
 * @desc    Export statistics data
 * @access  Private (Leaders and Admin)
 */
router.get('/export',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.export),
  handleValidationErrors,
  technicianStatsController.exportStats
);

/**
 * @route   GET /api/stats/reports/monthly
 * @desc    Get monthly performance report
 * @access  Private (Leaders and Admin)
 */
router.get('/reports/monthly',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.monthlyReport),
  handleValidationErrors,
  technicianStatsController.getMonthlyReport
);

/**
 * @route   GET /api/stats/reports/quarterly
 * @desc    Get quarterly performance report
 * @access  Private (Leaders and Admin)
 */
router.get('/reports/quarterly',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  validate(statsSchemas.quarterlyReport),
  handleValidationErrors,
  technicianStatsController.getQuarterlyReport
);

/**
 * @route   GET /api/stats/technician/:id/goals
 * @desc    Get technician goals and progress
 * @access  Private (Own goals or Leaders/Admin)
 */
router.get('/technician/:id/goals',
  technicianStatsController.getTechnicianGoals
);

/**
 * @route   PUT /api/stats/technician/:id/goals
 * @desc    Set technician goals
 * @access  Private (Leaders and Admin)
 */
router.put('/technician/:id/goals',
  requireRole(['technician_leader', 'admin']),
  validate(statsSchemas.setGoals),
  handleValidationErrors,
  technicianStatsController.setTechnicianGoals
);

/**
 * @route   GET /api/stats/benchmarks
 * @desc    Get performance benchmarks
 * @access  Private (Leaders and Admin)
 */
router.get('/benchmarks',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  technicianStatsController.getPerformanceBenchmarks
);

module.exports = router;

