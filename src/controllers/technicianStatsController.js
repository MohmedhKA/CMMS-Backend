const TechnicianStats = require('../models/TechnicianStats');

class TechnicianStatsController {
  // Get stats by technician ID
  async getStatsByTechnicianId(req, res) {
    try {
      const { id } = req.params;
      const { limit = 12 } = req.query;

      // Check if user can access these stats
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own statistics'
        });
      }

      const stats = await TechnicianStats.findByTechnicianId(id, parseInt(limit));

      res.json({
        success: true,
        message: 'Technician statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get stats by technician ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current month stats for technician
  async getCurrentMonthStats(req, res) {
    try {
      const { id } = req.params;

      // Check if user can access these stats
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own statistics'
        });
      }

      const stats = await TechnicianStats.getCurrentMonthStats(id);

      if (!stats) {
        return res.json({
          success: true,
          message: 'No statistics found for current month',
          data: {
            stats: null
          }
        });
      }

      res.json({
        success: true,
        message: 'Current month statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get current month stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get stats by time period
  async getStatsByTimePeriod(req, res) {
    try {
      const { startDate, endDate, sector } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const stats = await TechnicianStats.findByTimePeriod(
        new Date(startDate),
        new Date(endDate),
        sector
      );

      res.json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get stats by time period error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const { sector, limit = 10 } = req.query;

      const leaderboard = await TechnicianStats.getLeaderboard(sector, parseInt(limit));

      res.json({
        success: true,
        message: 'Leaderboard retrieved successfully',
        data: {
          leaderboard
        }
      });

    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get aggregated stats for technician
  async getAggregatedStats(req, res) {
    try {
      const { id } = req.params;
      const { months = 6 } = req.query;

      // Check if user can access these stats
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own statistics'
        });
      }

      const stats = await TechnicianStats.getAggregatedStats(id, parseInt(months));

      res.json({
        success: true,
        message: 'Aggregated statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get aggregated stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get sector performance
  async getSectorPerformance(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const performance = await TechnicianStats.getSectorPerformance(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        message: 'Sector performance retrieved successfully',
        data: {
          performance
        }
      });

    } catch (error) {
      console.error('Get sector performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Generate monthly stats (admin only)
  async generateMonthlyStats(req, res) {
    try {
      const { year, month } = req.body;

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Year and month are required'
        });
      }

      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }

      await TechnicianStats.generateMonthlyStats(parseInt(year), parseInt(month));

      res.json({
        success: true,
        message: `Monthly statistics generated for ${year}-${month}`
      });

    } catch (error) {
      console.error('Generate monthly stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get efficiency metrics
  async getEfficiencyMetrics(req, res) {
    try {
      const { id } = req.params;
      const { months = 3 } = req.query;

      // Check if user can access these stats
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own statistics'
        });
      }

      const metrics = await TechnicianStats.getEfficiencyMetrics(id, parseInt(months));

      res.json({
        success: true,
        message: 'Efficiency metrics retrieved successfully',
        data: {
          metrics
        }
      });

    } catch (error) {
      console.error('Get efficiency metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get technician dashboard data
  async getTechnicianDashboard(req, res) {
    try {
      const { id } = req.params;

      // Check if user can access this dashboard
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own dashboard'
        });
      }

      // Get various stats for dashboard
      const [
        currentStats,
        aggregatedStats,
        efficiencyMetrics,
        recentStats
      ] = await Promise.all([
        TechnicianStats.getCurrentMonthStats(id),
        TechnicianStats.getAggregatedStats(id, 6),
        TechnicianStats.getEfficiencyMetrics(id, 3),
        TechnicianStats.findByTechnicianId(id, 6)
      ]);

      const dashboardData = {
        currentMonth: currentStats,
        aggregated: aggregatedStats,
        efficiency: efficiencyMetrics,
        recentMonths: recentStats
      };

      res.json({
        success: true,
        message: 'Technician dashboard data retrieved successfully',
        data: dashboardData
      });

    } catch (error) {
      console.error('Get technician dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get team leader dashboard data
  async getTeamLeaderDashboard(req, res) {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get various stats for team leader dashboard
      const [
        leaderboard,
        sectorPerformance,
        monthlyStats
      ] = await Promise.all([
        TechnicianStats.getLeaderboard(null, 20),
        TechnicianStats.getSectorPerformance(startOfMonth, endOfMonth),
        TechnicianStats.findByTimePeriod(startOfMonth, endOfMonth)
      ]);

      const dashboardData = {
        leaderboard,
        sectorPerformance,
        monthlyStats,
        totalTechnicians: leaderboard.length
      };

      res.json({
        success: true,
        message: 'Team leader dashboard data retrieved successfully',
        data: dashboardData
      });

    } catch (error) {
      console.error('Get team leader dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get performance comparison
  async getPerformanceComparison(req, res) {
    try {
      const { technicianIds, startDate, endDate } = req.query;

      if (!technicianIds || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Technician IDs, start date, and end date are required'
        });
      }

      const ids = Array.isArray(technicianIds) ? technicianIds : [technicianIds];
      
      const comparisonData = await Promise.all(
        ids.map(async (id) => {
          const stats = await TechnicianStats.findByTimePeriod(
            new Date(startDate),
            new Date(endDate)
          );
          return stats.filter(stat => stat.technician_id === id);
        })
      );

      res.json({
        success: true,
        message: 'Performance comparison retrieved successfully',
        data: {
          comparison: comparisonData
        }
      });

    } catch (error) {
      console.error('Get performance comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get top performers
  async getTopPerformers(req, res) {
    try {
      const { period = 'month', limit = 5 } = req.query;

      let startDate, endDate;
      const currentDate = new Date();

      if (period === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else if (period === 'quarter') {
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
        endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
      } else if (period === 'year') {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Period must be month, quarter, or year'
        });
      }

      const topPerformers = await TechnicianStats.findByTimePeriod(startDate, endDate);
      
      // Sort by points and take top performers
      const sortedPerformers = topPerformers
        .sort((a, b) => b.points - a.points)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        message: 'Top performers retrieved successfully',
        data: {
          topPerformers: sortedPerformers,
          period,
          startDate,
          endDate
        }
      });

    } catch (error) {
      console.error('Get top performers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new TechnicianStatsController();

