const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const uploadDirs = [
    'uploads',
    'uploads/reports',
    'uploads/parts',
    'uploads/temp',
    'uploads/documents'
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// File filter function
const fileFilter = (allowedTypes = ['jpg', 'jpeg', 'png', 'pdf']) => {
  return (req, file, cb) => {
    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400), false);
    }
  };
};

// Storage configuration
const createStorage = (destination = 'uploads/temp') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure destination directory exists
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uniqueSuffix}${fileExtension}`;
      cb(null, fileName);
    }
  });
};

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// File size limits (in bytes)
const fileSizeLimits = {
  image: 5 * 1024 * 1024,    // 5MB for images
  document: 10 * 1024 * 1024, // 10MB for documents
  general: 5 * 1024 * 1024    // 5MB general limit
};

// Multer configurations for different use cases
const uploadConfigs = {
  // Report image upload
  reportImage: multer({
    storage: createStorage('uploads/reports'),
    fileFilter: fileFilter(['jpg', 'jpeg', 'png']),
    limits: {
      fileSize: fileSizeLimits.image,
      files: 1
    }
  }),

  // Part document upload
  partDocument: multer({
    storage: createStorage('uploads/parts'),
    fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'pdf']),
    limits: {
      fileSize: fileSizeLimits.document,
      files: 1
    }
  }),

  // General file upload
  general: multer({
    storage: createStorage('uploads/temp'),
    fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),
    limits: {
      fileSize: fileSizeLimits.general,
      files: 1
    }
  }),

  // Multiple files upload
  multiple: multer({
    storage: createStorage('uploads/temp'),
    fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'pdf']),
    limits: {
      fileSize: fileSizeLimits.general,
      files: 5
    }
  }),

  // Memory upload for processing
  memory: multer({
    storage: memoryStorage,
    fileFilter: fileFilter(['jpg', 'jpeg', 'png', 'pdf']),
    limits: {
      fileSize: fileSizeLimits.general,
      files: 1
    }
  })
};

// File upload middleware factory
const createUploadMiddleware = (config = 'general', fieldName = 'file') => {
  const upload = uploadConfigs[config];
  
  if (!upload) {
    throw new Error(`Upload configuration '${config}' not found`);
  }

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new AppError('File too large', 413));
            case 'LIMIT_FILE_COUNT':
              return next(new AppError('Too many files', 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new AppError(`Unexpected field: ${err.field}`, 400));
            default:
              return next(new AppError('File upload error', 400));
          }
        }
        return next(err);
      }

      // Add file metadata to request
      if (req.file) {
        req.file.uploadedAt = new Date();
        req.file.uploadedBy = req.user?.id;
      }

      next();
    });
  };
};

// Multiple files upload middleware
const createMultipleUploadMiddleware = (config = 'multiple', fieldName = 'files', maxCount = 5) => {
  const upload = uploadConfigs[config];
  
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new AppError('One or more files are too large', 413));
            case 'LIMIT_FILE_COUNT':
              return next(new AppError(`Maximum ${maxCount} files allowed`, 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new AppError(`Unexpected field: ${err.field}`, 400));
            default:
              return next(new AppError('File upload error', 400));
          }
        }
        return next(err);
      }

      // Add metadata to files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          file.uploadedAt = new Date();
          file.uploadedBy = req.user?.id;
        });
      }

      next();
    });
  };
};

// File validation middleware
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new AppError('No file uploaded', 400));
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    // Check if file exists
    if (!file) {
      return next(new AppError('Invalid file', 400));
    }

    // Check file size
    if (file.size === 0) {
      return next(new AppError('Empty file not allowed', 400));
    }

    // Additional security checks
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (suspiciousExtensions.includes(fileExtension)) {
      return next(new AppError('File type not allowed for security reasons', 400));
    }
  }

  next();
};

// File cleanup utility
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
};

// Cleanup old temporary files
const cleanupTempFiles = (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours
  const tempDir = 'uploads/temp';
  
  if (!fs.existsSync(tempDir)) {
    return;
  }

  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('Error reading temp directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for ${filePath}:`, err);
          return;
        }

        const now = new Date().getTime();
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          cleanupFile(filePath);
        }
      });
    });
  });
};

// Schedule cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// File URL generator
const generateFileUrl = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const relativePath = filePath.replace(/\\/g, '/'); // Normalize path separators
  return `${baseUrl}/${relativePath}`;
};

// File metadata extractor
const extractFileMetadata = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    extension: path.extname(file.originalname).toLowerCase(),
    uploadedAt: file.uploadedAt,
    uploadedBy: file.uploadedBy
  };
};

// Image processing middleware (placeholder for future image processing)
const processImage = (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  // Here you could add image processing logic:
  // - Resize images
  // - Generate thumbnails
  // - Optimize file size
  // - Add watermarks
  
  next();
};

// File serving middleware
const serveFile = (req, res, next) => {
  const filePath = req.params.filePath;
  const fullPath = path.join(process.cwd(), 'uploads', filePath);

  // Security check: ensure file is within uploads directory
  const normalizedPath = path.normalize(fullPath);
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  if (!normalizedPath.startsWith(uploadsDir)) {
    return next(new AppError('Access denied', 403));
  }

  // Check if file exists
  if (!fs.existsSync(normalizedPath)) {
    return next(new AppError('File not found', 404));
  }

  // Set appropriate headers
  const stat = fs.statSync(normalizedPath);
  const fileExtension = path.extname(normalizedPath).toLowerCase();
  
  let contentType = 'application/octet-stream';
  if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
    contentType = 'image/jpeg';
  } else if (fileExtension === '.png') {
    contentType = 'image/png';
  } else if (fileExtension === '.pdf') {
    contentType = 'application/pdf';
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

  // Stream file to response
  const fileStream = fs.createReadStream(normalizedPath);
  fileStream.pipe(res);
};

module.exports = {
  uploadConfigs,
  createUploadMiddleware,
  createMultipleUploadMiddleware,
  validateFile,
  cleanupFile,
  cleanupTempFiles,
  generateFileUrl,
  extractFileMetadata,
  processImage,
  serveFile,
  ensureUploadDirs
};

