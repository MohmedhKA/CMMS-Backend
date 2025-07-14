const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'cmms-backend',
      audience: 'cmms-frontend'
    });
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'cmms-backend',
      audience: 'cmms-frontend'
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'cmms-backend',
        audience: 'cmms-frontend'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'cmms-backend',
        audience: 'cmms-frontend'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Login user
  async login(employee_id, password) {
    try {
      // Find user by employee ID
      const user = await User.findByEmployeeId(employee_id);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        employee_id: user.employee_id,
        role: user.role,
        username: user.username
      };

      const accessToken = this.generateToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({ userId: user.id });

      return {
        success: true,
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.jwtExpiresIn
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Get user details
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const tokenPayload = {
        userId: user.id,
        employee_id: user.employee_id,
        role: user.role,
        username: user.username
      };

      const newAccessToken = this.generateToken(tokenPayload);

      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: this.jwtExpiresIn
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Register new user (only for authorized roles)
  async register(userData, createdBy) {
    try {
      const { username, employee_id, password, role, device_token } = userData;

      // Validate role permissions
      const creatorUser = await User.findById(createdBy);
      if (!creatorUser) {
        throw new Error('Creator not found');
      }

      // Check if creator has permission to create this role
      if (!this.canCreateRole(creatorUser.role, role)) {
        throw new Error('Insufficient permissions to create this role');
      }

      // Check if employee ID already exists
      const existingUser = await User.findByEmployeeId(employee_id);
      if (existingUser) {
        throw new Error('Employee ID already exists');
      }

      // Create new user
      const newUser = await User.create({
        username,
        employee_id,
        password,
        role,
        device_token
      });

      return {
        success: true,
        user: newUser.toJSON(),
        message: 'User created successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Check if user can create a specific role
  canCreateRole(creatorRole, targetRole) {
    const permissions = {
      'admin': ['worker', 'technician', 'workers_leader', 'technician_leader', 'admin'],
      'workers_leader': ['worker'],
      'technician_leader': ['technician'],
      'technician': [],
      'worker': []
    };

    return permissions[creatorRole]?.includes(targetRole) || false;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      if (!this.isPasswordStrong(newPassword)) {
        throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Validate password strength
  isPasswordStrong(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  // Update device token for push notifications
  async updateDeviceToken(userId, deviceToken) {
    try {
      const updatedUser = await User.updateDeviceToken(userId, deviceToken);
      
      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Device token updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Logout (in a real implementation, you might want to blacklist the token)
  async logout(token) {
    try {
      // In a production environment, you would typically:
      // 1. Add the token to a blacklist/redis cache
      // 2. Set an expiration time equal to the token's remaining life
      // For now, we'll just return success
      
      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        user: user.toJSON()
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Validate user permissions for specific actions
  validatePermission(userRole, requiredPermission) {
    const rolePermissions = {
      'admin': ['*'], // Admin has all permissions
      'workers_leader': [
        'create_worker',
        'view_worker_dashboard',
        'view_all_reports',
        'view_sector_stats'
      ],
      'technician_leader': [
        'create_technician',
        'view_technician_dashboard',
        'assign_reports',
        'view_all_reports',
        'view_technician_stats',
        'manage_team_assignments'
      ],
      'technician': [
        'view_reports',
        'update_report_status',
        'claim_report',
        'order_parts',
        'join_team',
        'call_for_help'
      ],
      'worker': [
        'create_report',
        'view_own_reports'
      ]
    };

    // Admin has all permissions
    if (userRole === 'admin') {
      return true;
    }

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(requiredPermission);
  }

  // Generate password reset token (for future implementation)
  generatePasswordResetToken(userId) {
    return jwt.sign(
      { userId, type: 'password_reset' },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  // Verify password reset token
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }

  // Hash password (utility method)
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password (utility method)
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = new AuthService();

