const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { rateLimiters, handleValidationErrors } = require('../middleware/security');
const { 
  createUploadMiddleware, 
  createMultipleUploadMiddleware,
  validateFile, 
  serveFile,
  cleanupFile,
  generateFileUrl,
  extractFileMetadata
} = require('../middleware/fileUpload');
const { validate, fileSchemas } = require('../utils/validation');

const router = express.Router();

// Apply file upload rate limiting
router.use(rateLimiters.fileUpload);

// All file routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/files/upload
 * @desc    Upload single file
 * @access  Private (All authenticated users)
 */
router.post('/upload',
  createUploadMiddleware('general', 'file'),
  validateFile,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileMetadata = extractFileMetadata(req.file);
      const fileUrl = generateFileUrl(req, req.file.path);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          file: {
            ...fileMetadata,
            url: fileUrl
          }
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'File upload failed'
      });
    }
  }
);

/**
 * @route   POST /api/files/upload-multiple
 * @desc    Upload multiple files
 * @access  Private (All authenticated users)
 */
router.post('/upload-multiple',
  createMultipleUploadMiddleware('multiple', 'files', 5),
  validateFile,
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => {
        const fileMetadata = extractFileMetadata(file);
        const fileUrl = generateFileUrl(req, file.path);
        
        return {
          ...fileMetadata,
          url: fileUrl
        };
      });

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: {
          files: uploadedFiles
        }
      });

    } catch (error) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({
        success: false,
        message: 'File upload failed'
      });
    }
  }
);

/**
 * @route   POST /api/files/upload-report-image
 * @desc    Upload report image
 * @access  Private (All authenticated users)
 */
router.post('/upload-report-image',
  createUploadMiddleware('reportImage', 'image'),
  validateFile,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image uploaded'
        });
      }

      const fileMetadata = extractFileMetadata(req.file);
      const fileUrl = generateFileUrl(req, req.file.path);

      res.status(201).json({
        success: true,
        message: 'Report image uploaded successfully',
        data: {
          image: {
            ...fileMetadata,
            url: fileUrl
          }
        }
      });

    } catch (error) {
      console.error('Report image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Image upload failed'
      });
    }
  }
);

/**
 * @route   POST /api/files/upload-part-document
 * @desc    Upload part document
 * @access  Private (Technicians and Leaders)
 */
router.post('/upload-part-document',
  requireRole(['technician', 'technician_leader', 'workers_leader', 'admin']),
  createUploadMiddleware('partDocument', 'document'),
  validateFile,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document uploaded'
        });
      }

      const fileMetadata = extractFileMetadata(req.file);
      const fileUrl = generateFileUrl(req, req.file.path);

      res.status(201).json({
        success: true,
        message: 'Part document uploaded successfully',
        data: {
          document: {
            ...fileMetadata,
            url: fileUrl
          }
        }
      });

    } catch (error) {
      console.error('Part document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Document upload failed'
      });
    }
  }
);

/**
 * @route   GET /api/files/:filePath
 * @desc    Serve/download file
 * @access  Private (All authenticated users)
 */
router.get('/*',
  (req, res, next) => {
    req.params.filePath = req.params[0];
    next();
  },
  serveFile
);

/**
 * @route   DELETE /api/files/:filePath
 * @desc    Delete file
 * @access  Private (File owner or Leaders/Admin)
 */
router.delete('/*',
  (req, res, next) => {
    req.params.filePath = req.params[0];
    next();
  },
  async (req, res, next) => {
    try {
      const filePath = req.params.filePath;
      const fullPath = path.join(process.cwd(), 'uploads', filePath);

      // Security check: ensure file is within uploads directory
      const normalizedPath = path.normalize(fullPath);
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!normalizedPath.startsWith(uploadsDir)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(normalizedPath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // TODO: Add file ownership check here
      // For now, only allow leaders and admin to delete files
      if (!['technician_leader', 'workers_leader', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete file'
        });
      }

      // Delete file
      cleanupFile(normalizedPath);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'File deletion failed'
      });
    }
  }
);

/**
 * @route   GET /api/files/list/:directory
 * @desc    List files in directory
 * @access  Private (Leaders and Admin)
 */
router.get('/list/:directory',
  requireRole(['technician_leader', 'workers_leader', 'admin']),
  async (req, res, next) => {
    try {
      const { directory } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const allowedDirectories = ['reports', 'parts', 'documents', 'temp'];
      
      if (!allowedDirectories.includes(directory)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid directory'
        });
      }

      const fs = require('fs');
      const path = require('path');
      const directoryPath = path.join(process.cwd(), 'uploads', directory);

      if (!fs.existsSync(directoryPath)) {
        return res.json({
          success: true,
          message: 'Directory is empty',
          data: {
            files: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0
            }
          }
        });
      }

      const files = fs.readdirSync(directoryPath);
      const fileStats = files.map(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: generateFileUrl(req, path.join('uploads', directory, file))
        };
      });

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedFiles = fileStats.slice(startIndex, endIndex);

      res.json({
        success: true,
        message: 'Files retrieved successfully',
        data: {
          files: paginatedFiles,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: fileStats.length
          }
        }
      });

    } catch (error) {
      console.error('File listing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list files'
      });
    }
  }
);

/**
 * @route   POST /api/files/cleanup
 * @desc    Cleanup old temporary files
 * @access  Private (Admin only)
 */
router.post('/cleanup',
  requireRole(['admin']),
  async (req, res, next) => {
    try {
      const { maxAge = 24 } = req.body; // hours
      const maxAgeMs = maxAge * 60 * 60 * 1000;

      const { cleanupTempFiles } = require('../middleware/fileUpload');
      cleanupTempFiles(maxAgeMs);

      res.json({
        success: true,
        message: `Cleaned up temporary files older than ${maxAge} hours`
      });

    } catch (error) {
      console.error('File cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'File cleanup failed'
      });
    }
  }
);

/**
 * @route   GET /api/files/stats
 * @desc    Get file storage statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  requireRole(['admin']),
  async (req, res, next) => {
    try {
      const fs = require('fs');
      const path = require('path');

      const getDirectorySize = (dirPath) => {
        if (!fs.existsSync(dirPath)) return 0;
        
        let totalSize = 0;
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });
        
        return totalSize;
      };

      const uploadsDir = path.join(process.cwd(), 'uploads');
      const directories = ['reports', 'parts', 'documents', 'temp'];
      
      const stats = {
        totalSize: 0,
        directories: {}
      };

      directories.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        const size = getDirectorySize(dirPath);
        stats.directories[dir] = {
          size,
          sizeFormatted: `${(size / (1024 * 1024)).toFixed(2)} MB`
        };
        stats.totalSize += size;
      });

      stats.totalSizeFormatted = `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`;

      res.json({
        success: true,
        message: 'File statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('File stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file statistics'
      });
    }
  }
);

module.exports = router;

