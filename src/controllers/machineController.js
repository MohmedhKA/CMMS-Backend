const Machine = require('../models/Machine');

class MachineController {
  // Create new machine
  async createMachine(req, res) {
    try {
      const machineData = {
        ...req.body,
        created_by: req.user.id
      };

      const newMachine = await Machine.create(machineData);

      res.status(201).json({
        success: true,
        message: 'Machine created successfully',
        data: {
          machine: newMachine
        }
      });

    } catch (error) {
      console.error('Create machine error:', error);
      
      if (error.message === 'QR code value already exists') {
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

  // Get all machines with pagination and filtering
  async getAllMachines(req, res) {
    try {
      const { page = 1, limit = 20, sector } = req.query;
      const offset = (page - 1) * limit;

      const machines = await Machine.findAll(parseInt(limit), parseInt(offset), sector);

      res.json({
        success: true,
        message: 'Machines retrieved successfully',
        data: {
          machines,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: machines.length
          }
        }
      });

    } catch (error) {
      console.error('Get all machines error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machine by ID
  async getMachineById(req, res) {
    try {
      const { id } = req.params;

      const machine = await Machine.findById(id);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      res.json({
        success: true,
        message: 'Machine retrieved successfully',
        data: {
          machine
        }
      });

    } catch (error) {
      console.error('Get machine by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machine by QR code
  async getMachineByQRCode(req, res) {
    try {
      const { qr_code } = req.params;

      const machine = await Machine.findByQRCode(qr_code);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      res.json({
        success: true,
        message: 'Machine retrieved successfully',
        data: {
          machine
        }
      });

    } catch (error) {
      console.error('Get machine by QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machines by sector
  async getMachinesBySector(req, res) {
    try {
      const { sector } = req.params;

      const machines = await Machine.findBySector(sector);

      res.json({
        success: true,
        message: 'Machines retrieved successfully',
        data: {
          machines
        }
      });

    } catch (error) {
      console.error('Get machines by sector error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machines by grid location
  async getMachinesByGridLocation(req, res) {
    try {
      const { grid_location } = req.params;
      const { sector } = req.query;

      const machines = await Machine.findByGridLocation(grid_location, sector);

      res.json({
        success: true,
        message: 'Machines retrieved successfully',
        data: {
          machines
        }
      });

    } catch (error) {
      console.error('Get machines by grid location error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update machine
  async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedMachine = await Machine.update(id, updateData);

      if (!updatedMachine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      res.json({
        success: true,
        message: 'Machine updated successfully',
        data: {
          machine: updatedMachine
        }
      });

    } catch (error) {
      console.error('Update machine error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete machine
  async deleteMachine(req, res) {
    try {
      const { id } = req.params;

      const deletedMachine = await Machine.delete(id);

      if (!deletedMachine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      res.json({
        success: true,
        message: 'Machine deleted successfully'
      });

    } catch (error) {
      console.error('Delete machine error:', error);
      
      if (error.message === 'Cannot delete machine that has associated reports') {
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

  // Search machines
  async searchMachines(req, res) {
    try {
      const { q, sector } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const machines = await Machine.search(q.trim(), sector);

      res.json({
        success: true,
        message: 'Machine search completed',
        data: {
          machines
        }
      });

    } catch (error) {
      console.error('Search machines error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machine statistics
  async getMachineStats(req, res) {
    try {
      const stats = await Machine.getStatistics();

      res.json({
        success: true,
        message: 'Machine statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get machine stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get machines with report counts
  async getMachinesWithReportCounts(req, res) {
    try {
      const { sector, startDate, endDate } = req.query;

      const machines = await Machine.findWithReportCounts(sector, startDate, endDate);

      res.json({
        success: true,
        message: 'Machines with report counts retrieved successfully',
        data: {
          machines
        }
      });

    } catch (error) {
      console.error('Get machines with report counts error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get unique sectors
  async getUniqueSectors(req, res) {
    try {
      const sectors = await Machine.getUniqueSectors();

      res.json({
        success: true,
        message: 'Unique sectors retrieved successfully',
        data: {
          sectors
        }
      });

    } catch (error) {
      console.error('Get unique sectors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get unique grid locations
  async getUniqueGridLocations(req, res) {
    try {
      const { sector } = req.query;

      const gridLocations = await Machine.getUniqueGridLocations(sector);

      res.json({
        success: true,
        message: 'Unique grid locations retrieved successfully',
        data: {
          gridLocations
        }
      });

    } catch (error) {
      console.error('Get unique grid locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Bulk create machines
  async bulkCreateMachines(req, res) {
    try {
      const { machines } = req.body;
      const created_by = req.user.id;

      if (!Array.isArray(machines) || machines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Machines array is required and cannot be empty'
        });
      }

      // Validate each machine data
      for (const machine of machines) {
        if (!machine.qr_code_value || !machine.machine_label || !machine.sector || !machine.grid_location) {
          return res.status(400).json({
            success: false,
            message: 'Each machine must have qr_code_value, machine_label, sector, and grid_location'
          });
        }
      }

      const createdMachines = await Machine.bulkCreate(machines, created_by);

      res.status(201).json({
        success: true,
        message: `${createdMachines.length} machines created successfully`,
        data: {
          machines: createdMachines
        }
      });

    } catch (error) {
      console.error('Bulk create machines error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Generate QR code data (for future QR code generation)
  async generateQRCode(req, res) {
    try {
      const { id } = req.params;

      const machine = await Machine.findById(id);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Machine not found'
        });
      }

      // In a real implementation, you would generate a QR code image
      // For now, we'll return the QR code data
      const qrData = {
        machine_id: machine.id,
        qr_code_value: machine.qr_code_value,
        machine_label: machine.machine_label,
        sector: machine.sector,
        grid_location: machine.grid_location
      };

      res.json({
        success: true,
        message: 'QR code data generated successfully',
        data: {
          qrData,
          qrString: JSON.stringify(qrData)
        }
      });

    } catch (error) {
      console.error('Generate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Validate QR code
  async validateQRCode(req, res) {
    try {
      const { qr_code_value } = req.body;

      if (!qr_code_value) {
        return res.status(400).json({
          success: false,
          message: 'QR code value is required'
        });
      }

      const machine = await Machine.findByQRCode(qr_code_value);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: 'Invalid QR code'
        });
      }

      res.json({
        success: true,
        message: 'QR code is valid',
        data: {
          machine
        }
      });

    } catch (error) {
      console.error('Validate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new MachineController();

