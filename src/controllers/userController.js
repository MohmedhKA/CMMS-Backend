const User = require('../models/User');
const authService = require('../services/authService');

class UserController {
  // Get all users with pagination and filtering
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role } = req.query;
      const offset = (page - 1) * limit;

      const users = await User.findAll(parseInt(limit), parseInt(offset), role);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: users.map(user => user.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: users.length
          }
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get users by role
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;

      const validRoles = ['worker', 'technician', 'workers_leader', 'technician_leader', 'admin'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      const users = await User.findByRole(role);

      res.json({
        success: true,
        message: `${role}s retrieved successfully`,
        data: {
          users: users.map(user => user.toJSON())
        }
      });

    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new user (registration handled by auth controller)
  async createUser(req, res) {
    try {
      const userData = req.body;
      const createdBy = req.user.id;

      const result = await authService.register(userData, createdBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: result.user
        }
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user device token
  async updateDeviceToken(req, res) {
    try {
      const { id } = req.params;
      const { device_token } = req.body;

      // Check if user can update this device token
      if (req.user.id !== id && !['admin', 'workers_leader', 'technician_leader'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Can only update your own device token'
        });
      }

      const updatedUser = await User.updateDeviceToken(id, device_token);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Device token updated successfully',
        data: {
          user: updatedUser.toJSON()
        }
      });

    } catch (error) {
      console.error('Update device token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (soft delete by deactivating)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const deletedUser = await User.delete(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const stats = await User.getCountByRole();

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get available technicians for assignment
  async getAvailableTechnicians(req, res) {
    try {
      const { sector, severity = 'low' } = req.query;

      const ReportTechnician = require('../models/ReportTechnician');
      const availableTechnicians = await ReportTechnician.getAvailableTechnicians(sector, severity);

      res.json({
        success: true,
        message: 'Available technicians retrieved successfully',
        data: {
          technicians: availableTechnicians
        }
      });

    } catch (error) {
      console.error('Get available technicians error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get technician workload
  async getTechnicianWorkload(req, res) {
    try {
      const { id } = req.params;

      // Check if user can view this workload
      if (req.user.id !== id && !['admin', 'technician_leader'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Can only view your own workload'
        });
      }

      const ReportTechnician = require('../models/ReportTechnician');
      const workload = await ReportTechnician.getTechnicianWorkload(id);

      res.json({
        success: true,
        message: 'Technician workload retrieved successfully',
        data: {
          workload
        }
      });

    } catch (error) {
      console.error('Get technician workload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search users
  async searchUsers(req, res) {
    try {
      const { q, role } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      // This would require implementing a search method in the User model
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        message: 'User search completed',
        data: {
          users: []
        }
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user dashboard data
  async getDashboardData(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let dashboardData = {};

      if (userRole === 'worker') {
        // Worker dashboard: recent reports, report counts
        const Report = require('../models/Report');
        const recentReports = await Report.findByReporter(userId, 5, 0);
        
        dashboardData = {
          recentReports: recentReports.slice(0, 2), // Last 2 reports as per requirements
          totalReports: recentReports.length
        };

      } else if (userRole === 'technician') {
        // Technician dashboard: assigned reports, due today, stats
        const Report = require('../models/Report');
        const TechnicianStats = require('../models/TechnicianStats');
        const ReportTechnician = require('../models/ReportTechnician');

        const [assignedReports, dueToday, currentStats, workload] = await Promise.all([
          Report.findByAssignedTo(userId),
          Report.findDueToday(userId),
          TechnicianStats.getCurrentMonthStats(userId),
          ReportTechnician.getTechnicianWorkload(userId)
        ]);

        dashboardData = {
          assignedReports: assignedReports.filter(r => r.status !== 'completed'),
          dueToday,
          currentStats,
          workload
        };

      } else if (userRole === 'workers_leader') {
        // Workers leader dashboard: sector reports, worker stats
        const Report = require('../models/Report');
        const sectorStats = await Report.getStatsBySector();

        dashboardData = {
          sectorStats,
          totalWorkers: await User.findByRole('worker').then(users => users.length)
        };

      } else if (userRole === 'technician_leader') {
        // Technician leader dashboard: technician stats, sector reports, team assignments
        const TechnicianStats = require('../models/TechnicianStats');
        const Report = require('../models/Report');

        const [technicianStats, sectorStats, escalatedReports] = await Promise.all([
          TechnicianStats.getLeaderboard(),
          Report.getStatsBySector(),
          Report.findEscalated()
        ]);

        dashboardData = {
          technicianStats,
          sectorStats,
          escalatedReports,
          totalTechnicians: await User.findByRole('technician').then(users => users.length)
        };

      } else if (userRole === 'admin') {
        // Admin dashboard: overall system stats
        const [userStats, reportStats] = await Promise.all([
          User.getCountByRole(),
          // Add overall report statistics here
        ]);

        dashboardData = {
          userStats,
          // reportStats
        };
      }

      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      });

    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();

