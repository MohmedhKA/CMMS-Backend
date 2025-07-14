const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Rate limiting configurations
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limit
  general: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later'),
  
  // Strict rate limit for authentication endpoints
  auth: createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later'),
  
  // Rate limit for report creation
  reportCreation: createRateLimiter(60 * 1000, 10, 'Too many reports created, please wait before creating another'),
  
  // Rate limit for file uploads
  fileUpload: createRateLimiter(60 * 1000, 5, 'Too many file uploads, please wait before uploading again'),
  
  // Rate limit for search endpoints
  search: createRateLimiter(60 * 1000, 30, 'Too many search requests, please wait before searching again')
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  try {
    // Recursively sanitize all string inputs
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove potential XSS patterns
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(500).json({
      success: false,
      message: 'Input processing error'
    });
  }
};

// SQL injection prevention middleware
const preventSQLInjection = (req, res, next) => {
  try {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|`)/g,
      /(\bOR\b|\bAND\b).*?[=<>]/gi
    ];

    const checkForSQLInjection = (value) => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      }
      return false;
    };

    const checkObject = (obj) => {
      for (const key in obj) {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
      return false;
    };

    let hasSQLInjection = false;

    if (req.body && checkObject(req.body)) hasSQLInjection = true;
    if (req.query && checkObject(req.query)) hasSQLInjection = true;
    if (req.params && checkObject(req.params)) hasSQLInjection = true;

    if (hasSQLInjection) {
      console.warn('Potential SQL injection attempt detected:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid input detected'
      });
    }

    next();
  } catch (error) {
    console.error('SQL injection prevention error:', error);
    res.status(500).json({
      success: false,
      message: 'Security check error'
    });
  }
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseInt(maxSize.replace(/[^\d]/g, '')) * (maxSize.includes('mb') ? 1024 * 1024 : 1024)
      : maxSize;

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }

    next();
  };
};

// IP whitelist/blacklist middleware
const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
      console.warn('Blocked IP attempt:', clientIP);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      console.warn('Non-whitelisted IP attempt:', clientIP);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Security event logger
const securityLogger = {
  logSecurityEvent: (event, details) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: 'HIGH'
    };
    
    console.warn('SECURITY EVENT:', JSON.stringify(logEntry));
    
    // In production, you might want to send this to a security monitoring service
    // or write to a dedicated security log file
  },

  logAuthFailure: (req, reason) => {
    securityLogger.logSecurityEvent('AUTH_FAILURE', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  logSuspiciousActivity: (req, activity) => {
    securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      activity,
      timestamp: new Date().toISOString()
    });
  }
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// File upload security
const fileUploadSecurity = {
  // Check file type
  checkFileType: (allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) => {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file) {
          const fileExtension = file.originalname.split('.').pop().toLowerCase();
          
          if (!allowedTypes.includes(fileExtension)) {
            return res.status(400).json({
              success: false,
              message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
            });
          }
        }
      }

      next();
    };
  },

  // Check file size
  checkFileSize: (maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }

      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file && file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
          });
        }
      }

      next();
    };
  },

  // Scan file content for malicious patterns
  scanFileContent: () => {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }

      // Basic malicious pattern detection
      const maliciousPatterns = [
        /<script/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi
      ];

      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file && file.buffer) {
          const content = file.buffer.toString();
          
          for (const pattern of maliciousPatterns) {
            if (pattern.test(content)) {
              securityLogger.logSecurityEvent('MALICIOUS_FILE_UPLOAD', {
                filename: file.originalname,
                pattern: pattern.toString(),
                ip: req.ip
              });
              
              return res.status(400).json({
                success: false,
                message: 'File contains potentially malicious content'
              });
            }
          }
        }
      }

      next();
    };
  }
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // In production, you should specify allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

module.exports = {
  rateLimiters,
  securityHeaders,
  sanitizeInput,
  preventSQLInjection,
  requestSizeLimiter,
  ipFilter,
  requestLogger,
  securityLogger,
  handleValidationErrors,
  fileUploadSecurity,
  corsOptions
};

