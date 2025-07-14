const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    
    employee_id: Joi.string()
      .pattern(/^[A-Z0-9]{4,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Employee ID must be 4-10 characters long and contain only uppercase letters and numbers',
        'any.required': 'Employee ID is required'
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    role: Joi.string()
      .valid('worker', 'technician', 'workers_leader', 'technician_leader', 'admin')
      .required()
      .messages({
        'any.only': 'Role must be one of: worker, technician, workers_leader, technician_leader, admin',
        'any.required': 'Role is required'
      }),
    
    device_token: Joi.string()
      .optional()
      .allow('')
  }),

  login: Joi.object({
    employee_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Employee ID is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    
    device_token: Joi.string()
      .optional()
      .allow('')
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  updateDeviceToken: Joi.object({
    device_token: Joi.string()
      .required()
      .messages({
        'any.required': 'Device token is required'
      })
  })
};

// Report validation schemas
const reportSchemas = {
  create: Joi.object({
    breakdown_type: Joi.string()
      .valid('mechanical', 'electrical', 'other')
      .required()
      .messages({
        'any.only': 'Breakdown type must be one of: mechanical, electrical, other',
        'any.required': 'Breakdown type is required'
      }),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
      }),
    
    safety_required: Joi.boolean()
      .default(false),
    
    assistance_required: Joi.boolean()
      .default(false),
    
    location_method: Joi.string()
      .valid('grid', 'qr')
      .required()
      .messages({
        'any.only': 'Location method must be either grid or qr',
        'any.required': 'Location method is required'
      }),
    
    sector: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Sector is required',
        'string.max': 'Sector cannot exceed 50 characters',
        'any.required': 'Sector is required'
      }),
    
    grid_location: Joi.string()
      .when('location_method', {
        is: 'grid',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.required': 'Grid location is required when using grid location method'
      }),
    
    machine_id: Joi.string()
      .uuid()
      .when('location_method', {
        is: 'qr',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.uuid': 'Machine ID must be a valid UUID',
        'any.required': 'Machine ID is required when using QR location method'
      }),
    
    image_url: Joi.string()
      .uri()
      .optional()
      .allow('')
      .messages({
        'string.uri': 'Image URL must be a valid URL'
      })
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('noticed', 'working', 'completed', 'archived')
      .required()
      .messages({
        'any.only': 'Status must be one of: noticed, working, completed, archived',
        'any.required': 'Status is required'
      })
  }),

  assign: Joi.object({
    technician_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Technician ID must be a valid UUID',
        'any.required': 'Technician ID is required'
      })
  })
};

// Machine validation schemas
const machineSchemas = {
  create: Joi.object({
    qr_code_value: Joi.string()
      .min(5)
      .max(100)
      .required()
      .messages({
        'string.min': 'QR code value must be at least 5 characters long',
        'string.max': 'QR code value cannot exceed 100 characters',
        'any.required': 'QR code value is required'
      }),
    
    machine_label: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Machine label is required',
        'string.max': 'Machine label cannot exceed 100 characters',
        'any.required': 'Machine label is required'
      }),
    
    sector: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Sector is required',
        'string.max': 'Sector cannot exceed 50 characters',
        'any.required': 'Sector is required'
      }),
    
    grid_location: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Grid location is required',
        'string.max': 'Grid location cannot exceed 50 characters',
        'any.required': 'Grid location is required'
      })
  }),

  update: Joi.object({
    machine_label: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Machine label cannot be empty',
        'string.max': 'Machine label cannot exceed 100 characters'
      }),
    
    sector: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Sector cannot be empty',
        'string.max': 'Sector cannot exceed 50 characters'
      }),
    
    grid_location: Joi.string()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Grid location cannot be empty',
        'string.max': 'Grid location cannot exceed 50 characters'
      })
  })
};

// Part validation schemas
const partSchemas = {
  create: Joi.object({
    part_number: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'Part number must be at least 3 characters long',
        'string.max': 'Part number cannot exceed 50 characters',
        'any.required': 'Part number is required'
      }),
    
    part_name: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Part name is required',
        'string.max': 'Part name cannot exceed 100 characters',
        'any.required': 'Part name is required'
      }),
    
    description: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    
    category: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Category is required',
        'string.max': 'Category cannot exceed 50 characters',
        'any.required': 'Category is required'
      }),
    
    manufacturer: Joi.string()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Manufacturer cannot exceed 100 characters'
      }),
    
    unit_price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Unit price must be a positive number',
        'any.required': 'Unit price is required'
      }),
    
    stock_quantity: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity cannot be negative'
      }),
    
    minimum_stock: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.integer': 'Minimum stock must be an integer',
        'number.min': 'Minimum stock cannot be negative'
      }),
    
    location: Joi.string()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Location cannot exceed 100 characters'
      })
  }),

  requestPart: Joi.object({
    part_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'Part ID must be a valid UUID',
        'any.required': 'Part ID is required'
      }),
    
    quantity_requested: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.integer': 'Quantity must be an integer',
        'number.positive': 'Quantity must be positive',
        'any.required': 'Quantity is required'
      }),
    
    reason: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Reason must be at least 10 characters long',
        'string.max': 'Reason cannot exceed 500 characters',
        'any.required': 'Reason is required'
      })
  })
};

// Common validation schemas
const commonSchemas = {
  uuid: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Must be a valid UUID',
      'any.required': 'ID is required'
    }),

  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),

  search: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search query is required',
        'string.max': 'Search query cannot exceed 100 characters',
        'any.required': 'Search query is required'
      })
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Custom validation functions
const customValidations = {
  // Check if date is valid and not in the future
  isValidPastDate: (date) => {
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate <= now && !isNaN(inputDate.getTime());
  },

  // Check if file type is allowed
  isAllowedFileType: (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) => {
    const extension = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  },

  // Check if file size is within limit
  isFileSizeValid: (size, maxSize = 5 * 1024 * 1024) => { // 5MB default
    return size <= maxSize;
  },

  // Sanitize HTML content
  sanitizeHtml: (html) => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
};

module.exports = {
  userSchemas,
  reportSchemas,
  machineSchemas,
  partSchemas,
  commonSchemas,
  validate,
  customValidations
};

