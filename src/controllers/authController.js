const authService = require('../services/authService');
const { userSchemas, validate } = require('../utils/validation');

class AuthController {
  // User login
  async login(req, res) {
    try {
      const { employee_id, password, device_token } = req.body;

      const result = await authService.login(employee_id, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      // Update device token if provided
      if (device_token) {
        await authService.updateDeviceToken(result.user.id, device_token);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshToken(refresh_token);

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // User registration (only for authorized roles)
  async register(req, res) {
    try {
      const userData = req.body;
      const createdBy = req.user.id;

      const result = await authService.register(userData, createdBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update device token
  async updateDeviceToken(req, res) {
    try {
      const { device_token } = req.body;
      const userId = req.user.id;

      const result = await authService.updateDeviceToken(userId, device_token);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Device token updated successfully'
      });

    } catch (error) {
      console.error('Update device token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const token = req.token;

      const result = await authService.logout(token);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const result = await authService.getProfile(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: result.user
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Verify token (for frontend to check if token is still valid)
  async verifyToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware already verified it)
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user.toJSON()
        }
      });

    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user permissions (for frontend to show/hide features)
  async getPermissions(req, res) {
    try {
      const userRole = req.user.role;

      const permissions = {
        'admin': [
          'create_user', 'view_all_users', 'delete_user',
          'view_all_reports', 'assign_reports', 'delete_reports',
          'view_all_stats', 'manage_parts', 'system_settings'
        ],
        'workers_leader': [
          'create_worker', 'view_worker_dashboard', 'view_all_reports', 'view_sector_stats'
        ],
        'technician_leader': [
          'create_technician', 'view_technician_dashboard', 'assign_reports',
          'view_all_reports', 'view_technician_stats', 'manage_team_assignments'
        ],
        'technician': [
          'view_reports', 'update_report_status', 'claim_report',
          'order_parts', 'join_team', 'call_for_help', 'view_own_stats'
        ],
        'worker': [
          'create_report', 'view_own_reports'
        ]
      };

      res.json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: {
          role: userRole,
          permissions: permissions[userRole] || []
        }
      });

    } catch (error) {
      console.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Password reset request (for future implementation)
  async requestPasswordReset(req, res) {
    try {
      const { employee_id } = req.body;

      // This would typically:
      // 1. Find user by employee_id
      // 2. Generate password reset token
      // 3. Send email/SMS with reset link
      // For now, we'll just return a placeholder response

      res.json({
        success: true,
        message: 'Password reset instructions have been sent to your registered contact'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Reset password with token (for future implementation)
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // This would typically:
      // 1. Verify reset token
      // 2. Update user password
      // 3. Invalidate the reset token

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();

