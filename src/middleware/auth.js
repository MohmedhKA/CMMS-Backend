const authService = require('../services/authService');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Get user details
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};

// Authorization middleware factory
const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has required permissions
      const hasPermission = requiredPermissions.some(permission => 
        authService.validatePermission(req.user.role, permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Role-based authorization middleware
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Role authorization error'
      });
    }
  };
};

// Middleware to check if user can access specific resource
const canAccessResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin can access everything
      if (userRole === 'admin') {
        return next();
      }

      switch (resourceType) {
        case 'user':
          // Users can only access their own profile unless they're leaders
          if (id !== userId && !['workers_leader', 'technician_leader'].includes(userRole)) {
            return res.status(403).json({
              success: false,
              message: 'Can only access your own profile'
            });
          }
          break;

        case 'report':
          // Workers can only access their own reports
          // Technicians can access assigned reports
          // Leaders can access all reports
          if (userRole === 'worker') {
            const Report = require('../models/Report');
            const report = await Report.findById(id);
            
            if (!report || report.reporter_id !== userId) {
              return res.status(403).json({
                success: false,
                message: 'Can only access your own reports'
              });
            }
          }
          break;

        case 'technician_stats':
          // Technicians can only access their own stats
          // Leaders can access all stats
          if (userRole === 'technician' && id !== userId) {
            return res.status(403).json({
              success: false,
              message: 'Can only access your own statistics'
            });
          }
          break;

        default:
          break;
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Resource access check failed'
      });
    }
  };
};

// Middleware to validate request ownership
const validateOwnership = (modelName, ownerField = 'user_id') => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin and leaders can access everything
      if (['admin', 'workers_leader', 'technician_leader'].includes(userRole)) {
        return next();
      }

      // Dynamically import the model
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      // Check ownership
      if (resource[ownerField] !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own resources'
        });
      }

      // Attach resource to request for further use
      req.resource = resource;
      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Ownership validation failed'
      });
    }
  };
};

// Middleware to check if user is active/enabled
const requireActiveUser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Add user status check if you have an 'is_active' field
    // For now, we'll assume all users are active
    
    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'User status check failed'
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = authService.verifyToken(token);
          const user = await User.findById(decoded.userId);
          
          if (user) {
            req.user = user;
            req.token = token;
          }
        } catch (error) {
          // Ignore token errors for optional auth
        }
      }
    }
    
    next();

  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Rate limiting by user
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequests.get(userId);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    userLimit.count++;
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  canAccessResource,
  validateOwnership,
  requireActiveUser,
  optionalAuth,
  rateLimitByUser
};

