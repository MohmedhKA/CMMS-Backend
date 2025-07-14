const { Part, PartRequest } = require('../models/Part');
const notificationService = require('../services/notificationService');

class PartController {
  // Create new part
  async createPart(req, res) {
    try {
      const partData = req.body;

      const newPart = await Part.create(partData);

      res.status(201).json({
        success: true,
        message: 'Part created successfully',
        data: {
          part: newPart
        }
      });

    } catch (error) {
      console.error('Create part error:', error);
      
      if (error.message === 'Part number already exists') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all parts with pagination and filtering
  async getAllParts(req, res) {
    try {
      const { page = 1, limit = 20, category, is_active = true } = req.query;
      const offset = (page - 1) * limit;

      const parts = await Part.findAll(parseInt(limit), parseInt(offset), category, is_active === 'true');

      res.json({
        success: true,
        message: 'Parts retrieved successfully',
        data: {
          parts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parts.length
          }
        }
      });

    } catch (error) {
      console.error('Get all parts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part by ID
  async getPartById(req, res) {
    try {
      const { id } = req.params;

      const part = await Part.findById(id);

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.json({
        success: true,
        message: 'Part retrieved successfully',
        data: {
          part
        }
      });

    } catch (error) {
      console.error('Get part by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part by part number
  async getPartByPartNumber(req, res) {
    try {
      const { part_number } = req.params;

      const part = await Part.findByPartNumber(part_number);

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.json({
        success: true,
        message: 'Part retrieved successfully',
        data: {
          part
        }
      });

    } catch (error) {
      console.error('Get part by part number error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Search parts
  async searchParts(req, res) {
    try {
      const { q, category, is_active = true } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const parts = await Part.search(q.trim(), category, is_active === 'true');

      res.json({
        success: true,
        message: 'Part search completed',
        data: {
          parts
        }
      });

    } catch (error) {
      console.error('Search parts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get parts by category
  async getPartsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { is_active = true } = req.query;

      const parts = await Part.findByCategory(category, is_active === 'true');

      res.json({
        success: true,
        message: 'Parts retrieved successfully',
        data: {
          parts
        }
      });

    } catch (error) {
      console.error('Get parts by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get low stock parts
  async getLowStockParts(req, res) {
    try {
      const parts = await Part.findLowStock();

      res.json({
        success: true,
        message: 'Low stock parts retrieved successfully',
        data: {
          parts
        }
      });

    } catch (error) {
      console.error('Get low stock parts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update part
  async updatePart(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedPart = await Part.update(id, updateData);

      if (!updatedPart) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.json({
        success: true,
        message: 'Part updated successfully',
        data: {
          part: updatedPart
        }
      });

    } catch (error) {
      console.error('Update part error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update part stock
  async updatePartStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation = 'set' } = req.body;

      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a non-negative number'
        });
      }

      const updatedPart = await Part.updateStock(id, quantity, operation);

      if (!updatedPart) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.json({
        success: true,
        message: 'Part stock updated successfully',
        data: {
          part: updatedPart
        }
      });

    } catch (error) {
      console.error('Update part stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete part (soft delete)
  async deletePart(req, res) {
    try {
      const { id } = req.params;

      const deletedPart = await Part.delete(id);

      if (!deletedPart) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.json({
        success: true,
        message: 'Part deleted successfully'
      });

    } catch (error) {
      console.error('Delete part error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part categories
  async getCategories(req, res) {
    try {
      const categories = await Part.getCategories();

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories
        }
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part manufacturers
  async getManufacturers(req, res) {
    try {
      const manufacturers = await Part.getManufacturers();

      res.json({
        success: true,
        message: 'Manufacturers retrieved successfully',
        data: {
          manufacturers
        }
      });

    } catch (error) {
      console.error('Get manufacturers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part statistics
  async getPartStats(req, res) {
    try {
      const stats = await Part.getStatistics();

      res.json({
        success: true,
        message: 'Part statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get part stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Bulk update stock
  async bulkUpdateStock(req, res) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Updates array is required and cannot be empty'
        });
      }

      const updatedParts = await Part.bulkUpdateStock(updates);

      res.json({
        success: true,
        message: `${updatedParts.length} parts updated successfully`,
        data: {
          parts: updatedParts
        }
      });

    } catch (error) {
      console.error('Bulk update stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Part Request Methods

  // Create part request
  async createPartRequest(req, res) {
    try {
      const requestData = {
        ...req.body,
        technician_id: req.user.id
      };

      const newRequest = await PartRequest.create(requestData);

      res.status(201).json({
        success: true,
        message: 'Part request created successfully',
        data: {
          request: newRequest
        }
      });

    } catch (error) {
      console.error('Create part request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all part requests
  async getAllPartRequests(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let requests;

      if (req.user.role === 'technician') {
        // Technicians can only see their own requests
        requests = await PartRequest.findByTechnician(req.user.id, status);
      } else {
        // Leaders and admins can see all requests
        requests = await PartRequest.findAll(parseInt(limit), parseInt(offset), status);
      }

      res.json({
        success: true,
        message: 'Part requests retrieved successfully',
        data: {
          requests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: requests.length
          }
        }
      });

    } catch (error) {
      console.error('Get all part requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part request by ID
  async getPartRequestById(req, res) {
    try {
      const { id } = req.params;

      const request = await PartRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Part request not found'
        });
      }

      // Check if user can access this request
      if (req.user.role === 'technician' && request.technician_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own requests'
        });
      }

      res.json({
        success: true,
        message: 'Part request retrieved successfully',
        data: {
          request
        }
      });

    } catch (error) {
      console.error('Get part request by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get part requests by technician
  async getPartRequestsByTechnician(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.query;

      // Check if user can access these requests
      if (req.user.role === 'technician' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own requests'
        });
      }

      const requests = await PartRequest.findByTechnician(id, status);

      res.json({
        success: true,
        message: 'Part requests retrieved successfully',
        data: {
          requests
        }
      });

    } catch (error) {
      console.error('Get part requests by technician error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Approve/reject part request
  async updatePartRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, quantity_approved, notes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either approved or rejected'
        });
      }

      const updatedRequest = await PartRequest.updateStatus(
        id, 
        status, 
        req.user.id, 
        quantity_approved, 
        notes
      );

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: 'Part request not found'
        });
      }

      // Send notification to technician
      try {
        await notificationService.notifyPartRequestStatus(updatedRequest, status);
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.json({
        success: true,
        message: `Part request ${status} successfully`,
        data: {
          request: updatedRequest
        }
      });

    } catch (error) {
      console.error('Update part request status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Mark part request as delivered
  async markPartRequestDelivered(req, res) {
    try {
      const { id } = req.params;

      const deliveredRequest = await PartRequest.markDelivered(id);

      if (!deliveredRequest) {
        return res.status(404).json({
          success: false,
          message: 'Part request not found'
        });
      }

      // Send notification to technician
      try {
        await notificationService.notifyPartRequestStatus(deliveredRequest, 'delivered');
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.json({
        success: true,
        message: 'Part request marked as delivered',
        data: {
          request: deliveredRequest
        }
      });

    } catch (error) {
      console.error('Mark part request delivered error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PartController();

