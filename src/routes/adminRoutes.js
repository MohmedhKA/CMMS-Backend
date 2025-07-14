const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { validate, adminSchemas } = require('../utils/validation');
const backgroundTasksService = require('../services/backgroundTasks');

const router = express.Router();

// Apply general rate limiting
router.use(rateLimiters.general);

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route   GET /api/admin/health
 * @desc    System health check
 * @access  Private (Admin only)
 */
router.get('/health',
  async (req, res, next) => {
    try {
      const { testConnection } = require('../config/database');
      
      const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        services: {
          database: false,
          backgroundTasks: false,
          fileSystem: false
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      // Check database connection
      try {
        await testConnection();
        healthStatus.services.database = true;
      } catch (error) {
        healthStatus.services.database = false;
        healthStatus.status = 'degraded';
      }

      // Check background tasks
      try {
        const taskStatus = backgroundTasksService.getTaskStatus();
        healthStatus.services.backgroundTasks = Object.keys(taskStatus).length > 0;
      } catch (error) {
        healthStatus.services.backgroundTasks = false;
        healthStatus.status = 'degraded';
      }

      // Check file system
      try {
        const fs = require('fs');
        fs.accessSync('./uploads', fs.constants.R_OK | fs.constants.W_OK);
        healthStatus.services.fileSystem = true;
      } catch (error) {
        healthStatus.services.fileSystem = false;
        healthStatus.status = 'degraded';
      }

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthStatus.status === 'healthy',
        message: `System is ${healthStatus.status}`,
        data: healthStatus
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        data: {
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          error: error.message
        }
      });
    }
  }
);

/**
 * @route   GET /api/admin/stats
 * @desc    System statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  async (req, res, next) => {
    try {
      const { query } = require('../config/database');

      // Get database statistics
      const userStats = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      const reportStats = await query('SELECT status, COUNT(*) as count FROM reports GROUP BY status');
      const machineStats = await query('SELECT sector, COUNT(*) as count FROM machine_map GROUP BY sector');
      const partStats = await query('SELECT category, COUNT(*) as count FROM parts WHERE is_active = true GROUP BY category');

      // Get system statistics
      const systemStats = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      };

      // Get background task status
      const taskStatus = backgroundTasksService.getTaskStatus();

      const stats = {
        database: {
          users: userStats.rows,
          reports: reportStats.rows,
          machines: machineStats.rows,
          parts: partStats.rows
        },
        system: systemStats,
        backgroundTasks: taskStatus,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'System statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('System stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system statistics'
      });
    }
  }
);

/**
 * @route   POST /api/admin/tasks/:taskName
 * @desc    Trigger background task manually
 * @access  Private (Admin only)
 */
router.post('/tasks/:taskName',
  async (req, res, next) => {
    try {
      const { taskName } = req.params;

      const result = await backgroundTasksService.triggerTask(taskName);

      res.json({
        success: true,
        message: `Task '${taskName}' executed successfully`,
        data: result
      });

    } catch (error) {
      console.error('Task trigger error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to trigger task'
      });
    }
  }
);

/**
 * @route   GET /api/admin/tasks/status
 * @desc    Get background task status
 * @access  Private (Admin only)
 */
router.get('/tasks/status',
  async (req, res, next) => {
    try {
      const taskStatus = backgroundTasksService.getTaskStatus();

      res.json({
        success: true,
        message: 'Task status retrieved successfully',
        data: {
          tasks: taskStatus,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Task status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get task status'
      });
    }
  }
);

/**
 * @route   GET /api/admin/logs
 * @desc    Get system logs
 * @access  Private (Admin only)
 */
router.get('/logs',
  async (req, res, next) => {
    try {
      const { lines = 100, level = 'all' } = req.query;
      
      // This is a simplified log retrieval
      // In production, you might want to use a proper logging system
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'System is running normally',
          source: 'system'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          message: 'Background tasks are running',
          source: 'background-tasks'
        }
      ];

      res.json({
        success: true,
        message: 'Logs retrieved successfully',
        data: {
          logs: logs.slice(0, parseInt(lines)),
          total: logs.length,
          level,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Logs retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve logs'
      });
    }
  }
);

/**
 * @route   POST /api/admin/backup
 * @desc    Create database backup
 * @access  Private (Admin only)
 */
router.post('/backup',
  async (req, res, next) => {
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      const fs = require('fs');

      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `cmms_backup_${timestamp}.sql`);

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cmms_db',
        username: process.env.DB_USER || 'cmms_user'
      };

      const pgDump = spawn('pg_dump', [
        '-h', dbConfig.host,
        '-p', dbConfig.port,
        '-U', dbConfig.username,
        '-d', dbConfig.database,
        '-f', backupFile
      ]);

      pgDump.on('close', (code) => {
        if (code === 0) {
          res.json({
            success: true,
            message: 'Database backup created successfully',
            data: {
              backupFile: path.basename(backupFile),
              timestamp: new Date().toISOString()
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Database backup failed'
          });
        }
      });

      pgDump.on('error', (error) => {
        console.error('Backup error:', error);
        res.status(500).json({
          success: false,
          message: 'Database backup failed'
        });
      });

    } catch (error) {
      console.error('Backup creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create backup'
      });
    }
  }
);

/**
 * @route   POST /api/admin/maintenance
 * @desc    Toggle maintenance mode
 * @access  Private (Admin only)
 */
router.post('/maintenance',
  validate(adminSchemas.maintenanceMode),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { enabled, message } = req.body;

      // In a real implementation, you would store this in database or cache
      // For now, we'll just return the status
      global.maintenanceMode = {
        enabled,
        message: message || 'System is under maintenance',
        enabledAt: enabled ? new Date().toISOString() : null,
        enabledBy: req.user.id
      };

      res.json({
        success: true,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        data: global.maintenanceMode
      });

    } catch (error) {
      console.error('Maintenance mode error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle maintenance mode'
      });
    }
  }
);

/**
 * @route   GET /api/admin/maintenance
 * @desc    Get maintenance mode status
 * @access  Private (Admin only)
 */
router.get('/maintenance',
  async (req, res, next) => {
    try {
      const maintenanceStatus = global.maintenanceMode || {
        enabled: false,
        message: null,
        enabledAt: null,
        enabledBy: null
      };

      res.json({
        success: true,
        message: 'Maintenance mode status retrieved',
        data: maintenanceStatus
      });

    } catch (error) {
      console.error('Maintenance status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get maintenance status'
      });
    }
  }
);

/**
 * @route   POST /api/admin/database/optimize
 * @desc    Optimize database performance
 * @access  Private (Admin only)
 */
router.post('/database/optimize',
  async (req, res, next) => {
    try {
      const { query } = require('../config/database');

      // Run database optimization commands
      await query('ANALYZE;');
      await query('VACUUM;');

      res.json({
        success: true,
        message: 'Database optimization completed',
        data: {
          timestamp: new Date().toISOString(),
          operations: ['ANALYZE', 'VACUUM']
        }
      });

    } catch (error) {
      console.error('Database optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Database optimization failed'
      });
    }
  }
);

/**
 * @route   GET /api/admin/database/size
 * @desc    Get database size information
 * @access  Private (Admin only)
 */
router.get('/database/size',
  async (req, res, next) => {
    try {
      const { query } = require('../config/database');

      const dbSizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT COUNT(*) FROM users) as user_count,
          (SELECT COUNT(*) FROM reports) as report_count,
          (SELECT COUNT(*) FROM machine_map) as machine_count,
          (SELECT COUNT(*) FROM parts) as part_count
      `;

      const tableSizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const [dbSize, tableSize] = await Promise.all([
        query(dbSizeQuery),
        query(tableSizeQuery)
      ]);

      res.json({
        success: true,
        message: 'Database size information retrieved',
        data: {
          overview: dbSize.rows[0],
          tables: tableSize.rows,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Database size error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get database size'
      });
    }
  }
);

/**
 * @route   POST /api/admin/notifications/test
 * @desc    Send test notification
 * @access  Private (Admin only)
 */
router.post('/notifications/test',
  validate(adminSchemas.testNotification),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { deviceToken, title, body } = req.body;
      const notificationService = require('../services/notificationService');

      const result = await notificationService.sendTestNotification(deviceToken);

      if (result) {
        res.json({
          success: true,
          message: 'Test notification sent successfully',
          data: {
            messageId: result,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to send test notification'
        });
      }

    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  }
);

/**
 * @route   GET /api/admin/system/info
 * @desc    Get detailed system information
 * @access  Private (Admin only)
 */
router.get('/system/info',
  async (req, res, next) => {
    try {
      const os = require('os');
      const fs = require('fs');
      const path = require('path');

      const systemInfo = {
        server: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime(),
          loadavg: os.loadavg(),
          totalmem: os.totalmem(),
          freemem: os.freemem(),
          cpus: os.cpus().length
        },
        node: {
          version: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid,
          cwd: process.cwd()
        },
        application: {
          name: 'CMMS Backend',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 5000
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'System information retrieved successfully',
        data: systemInfo
      });

    } catch (error) {
      console.error('System info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system information'
      });
    }
  }
);

module.exports = router;

