const cron = require('node-cron');
const Report = require('../models/Report');
const TechnicianStats = require('../models/TechnicianStats');
const notificationService = require('./notificationService');

class BackgroundTasksService {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  // Initialize all background tasks
  initialize() {
    if (this.isInitialized) {
      console.log('Background tasks already initialized');
      return;
    }

    console.log('Initializing background tasks...');

    // SLA escalation check - every 5 minutes
    this.scheduleTask('sla-escalation', '*/5 * * * *', this.checkSLAEscalation.bind(this));

    // Generate monthly technician stats - first day of every month at 2 AM
    this.scheduleTask('monthly-stats', '0 2 1 * *', this.generateMonthlyStats.bind(this));

    // Cleanup old temporary files - daily at 3 AM
    this.scheduleTask('cleanup-temp-files', '0 3 * * *', this.cleanupTempFiles.bind(this));

    // Archive old completed reports - weekly on Sunday at 4 AM
    this.scheduleTask('archive-reports', '0 4 * * 0', this.archiveOldReports.bind(this));

    // Send daily summary reports - daily at 8 AM
    this.scheduleTask('daily-summary', '0 8 * * *', this.sendDailySummary.bind(this));

    // Check low stock parts - daily at 9 AM
    this.scheduleTask('low-stock-check', '0 9 * * *', this.checkLowStockParts.bind(this));

    // Health check - every 30 minutes
    this.scheduleTask('health-check', '*/30 * * * *', this.performHealthCheck.bind(this));

    this.isInitialized = true;
    console.log('✅ Background tasks initialized successfully');
  }

  // Schedule a task
  scheduleTask(name, cronExpression, taskFunction) {
    try {
      const task = cron.schedule(cronExpression, async () => {
        console.log(`🔄 Running background task: ${name}`);
        const startTime = Date.now();
        
        try {
          await taskFunction();
          const duration = Date.now() - startTime;
          console.log(`✅ Background task completed: ${name} (${duration}ms)`);
        } catch (error) {
          console.error(`❌ Background task failed: ${name}`, error);
        }
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.tasks.set(name, task);
      task.start();
      
      console.log(`📅 Scheduled task: ${name} (${cronExpression})`);
    } catch (error) {
      console.error(`Failed to schedule task ${name}:`, error);
    }
  }

  // Check for SLA escalations
  async checkSLAEscalation() {
    try {
      const overdueReports = await Report.findOverdue();
      
      for (const report of overdueReports) {
        // Mark as escalated
        await Report.markEscalated(report.id);
        
        // Send escalation notification
        await notificationService.notifyEscalation(report);
        
        console.log(`📢 Escalated report: ${report.id} (${report.breakdown_type} in ${report.sector})`);
      }

      if (overdueReports.length > 0) {
        console.log(`⚠️ Escalated ${overdueReports.length} overdue reports`);
      }

    } catch (error) {
      console.error('SLA escalation check failed:', error);
    }
  }

  // Generate monthly technician statistics
  async generateMonthlyStats() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;

      await TechnicianStats.generateMonthlyStats(year, month);
      
      console.log(`📊 Generated monthly stats for ${year}-${month}`);

    } catch (error) {
      console.error('Monthly stats generation failed:', error);
    }
  }

  // Cleanup temporary files
  async cleanupTempFiles() {
    try {
      const { cleanupTempFiles } = require('../middleware/fileUpload');
      
      // Cleanup files older than 24 hours
      cleanupTempFiles(24 * 60 * 60 * 1000);
      
      console.log('🧹 Cleaned up temporary files');

    } catch (error) {
      console.error('Temp files cleanup failed:', error);
    }
  }

  // Archive old completed reports
  async archiveOldReports() {
    try {
      // Archive reports completed more than 90 days ago
      const archivedCount = await Report.archiveOldReports(90);
      
      console.log(`📁 Archived ${archivedCount} old reports`);

    } catch (error) {
      console.error('Report archiving failed:', error);
    }
  }

  // Send daily summary reports
  async sendDailySummary() {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Get reports created yesterday
      const { query } = require('../config/database');
      
      const dailyStatsQuery = `
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
          COUNT(CASE WHEN escalated = true THEN 1 END) as escalated_reports,
          COUNT(CASE WHEN safety_required = true THEN 1 END) as safety_reports,
          breakdown_type,
          sector
        FROM reports 
        WHERE DATE(created_at) = DATE($1)
        GROUP BY breakdown_type, sector
      `;

      const stats = await query(dailyStatsQuery, [yesterday.toISOString().split('T')[0]]);

      if (stats.rows.length > 0) {
        // Send summary to leaders and admins
        const summaryMessage = this.formatDailySummary(stats.rows, yesterday);
        
        await notificationService.sendToRoles(
          ['technician_leader', 'workers_leader', 'admin'],
          '📊 Daily CMMS Summary',
          summaryMessage,
          { type: 'daily_summary', date: yesterday.toISOString() }
        );

        console.log('📧 Sent daily summary reports');
      }

    } catch (error) {
      console.error('Daily summary failed:', error);
    }
  }

  // Format daily summary message
  formatDailySummary(stats, date) {
    const dateStr = date.toLocaleDateString();
    let summary = `Daily Summary for ${dateStr}\n\n`;

    const totals = stats.reduce((acc, stat) => {
      acc.total += parseInt(stat.total_reports);
      acc.completed += parseInt(stat.completed_reports);
      acc.escalated += parseInt(stat.escalated_reports);
      acc.safety += parseInt(stat.safety_reports);
      return acc;
    }, { total: 0, completed: 0, escalated: 0, safety: 0 });

    summary += `📈 Total Reports: ${totals.total}\n`;
    summary += `✅ Completed: ${totals.completed}\n`;
    summary += `⚠️ Escalated: ${totals.escalated}\n`;
    summary += `🚨 Safety Critical: ${totals.safety}\n\n`;

    if (totals.total > 0) {
      const completionRate = ((totals.completed / totals.total) * 100).toFixed(1);
      summary += `📊 Completion Rate: ${completionRate}%`;
    }

    return summary;
  }

  // Check low stock parts
  async checkLowStockParts() {
    try {
      const { Part } = require('../models/Part');
      const lowStockParts = await Part.findLowStock();

      if (lowStockParts.length > 0) {
        const message = `⚠️ Low Stock Alert: ${lowStockParts.length} parts are running low`;
        
        await notificationService.sendToRoles(
          ['technician_leader', 'admin'],
          'Low Stock Alert',
          message,
          { 
            type: 'low_stock_alert', 
            parts_count: lowStockParts.length,
            parts: lowStockParts.map(p => ({ id: p.id, name: p.part_name, stock: p.stock_quantity }))
          }
        );

        console.log(`📦 Low stock alert sent for ${lowStockParts.length} parts`);
      }

    } catch (error) {
      console.error('Low stock check failed:', error);
    }
  }

  // Perform system health check
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        database: false,
        memory: false,
        disk: false
      };

      // Check database connection
      try {
        const { testConnection } = require('../config/database');
        await testConnection();
        healthStatus.database = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      healthStatus.memory = memUsageMB < 500; // Less than 500MB
      healthStatus.memoryUsage = memUsageMB;

      // Check disk space (simplified)
      const fs = require('fs');
      try {
        const stats = fs.statSync('./');
        healthStatus.disk = true;
      } catch (error) {
        console.error('Disk health check failed:', error);
      }

      // Log health status
      const isHealthy = healthStatus.database && healthStatus.memory && healthStatus.disk;
      
      if (!isHealthy) {
        console.warn('❌ Health check failed:', healthStatus);
        
        // Send alert to admins if system is unhealthy
        await notificationService.sendToRoles(
          ['admin'],
          '🚨 System Health Alert',
          `System health check failed. Please check the system status.`,
          { type: 'health_alert', status: healthStatus }
        );
      } else {
        console.log('✅ System health check passed');
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  // Stop a specific task
  stopTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      console.log(`⏹️ Stopped background task: ${name}`);
    }
  }

  // Stop all tasks
  stopAllTasks() {
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`⏹️ Stopped background task: ${name}`);
    }
    this.tasks.clear();
    this.isInitialized = false;
    console.log('🛑 All background tasks stopped');
  }

  // Get task status
  getTaskStatus() {
    const status = {};
    for (const [name, task] of this.tasks) {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled
      };
    }
    return status;
  }

  // Manually trigger a task
  async triggerTask(name) {
    const taskFunctions = {
      'sla-escalation': this.checkSLAEscalation.bind(this),
      'monthly-stats': this.generateMonthlyStats.bind(this),
      'cleanup-temp-files': this.cleanupTempFiles.bind(this),
      'archive-reports': this.archiveOldReports.bind(this),
      'daily-summary': this.sendDailySummary.bind(this),
      'low-stock-check': this.checkLowStockParts.bind(this),
      'health-check': this.performHealthCheck.bind(this)
    };

    const taskFunction = taskFunctions[name];
    if (!taskFunction) {
      throw new Error(`Task '${name}' not found`);
    }

    console.log(`🔄 Manually triggering task: ${name}`);
    const startTime = Date.now();
    
    try {
      await taskFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ Manual task completed: ${name} (${duration}ms)`);
      return { success: true, duration };
    } catch (error) {
      console.error(`❌ Manual task failed: ${name}`, error);
      throw error;
    }
  }
}

// Create singleton instance
const backgroundTasksService = new BackgroundTasksService();

module.exports = backgroundTasksService;

