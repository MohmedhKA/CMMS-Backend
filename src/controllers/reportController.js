const Report = require('../models/Report');
const ReportTechnician = require('../models/ReportTechnician');
const TechnicianStats = require('../models/TechnicianStats');
const notificationService = require('../services/notificationService');

class ReportController {
  // Create new report
  async createReport(req, res) {
    try {
      const reportData = {
        ...req.body,
        reporter_id: req.user.id
      };

      const newReport = await Report.create(reportData);

      // Auto-assign team leader for high severity reports
      if (reportData.safety_required || reportData.breakdown_type === 'electrical') {
        try {
          await ReportTechnician.autoAssignTeamLeader(newReport.id);
        } catch (error) {
          console.warn('Failed to auto-assign team leader:', error.message);
        }
      }

      // Send notification to relevant technicians/leaders
      try {
        await notificationService.notifyNewReport(newReport);
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: {
          report: newReport
        }
      });

    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all reports with filtering and pagination
  async getAllReports(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        sector, 
        breakdown_type, 
        assigned_to,
        reporter_id,
        escalated 
      } = req.query;

      // Build filter conditions based on user role
      let reports = [];
      
      if (req.user.role === 'worker') {
        // Workers can only see their own reports
        reports = await Report.findByReporter(req.user.id, parseInt(limit), (page - 1) * limit);
      } else if (req.user.role === 'technician') {
        // Technicians can see assigned reports and unassigned reports
        if (assigned_to === req.user.id) {
          reports = await Report.findByAssignedTo(req.user.id, status);
        } else {
          reports = await Report.findUnassigned(sector);
        }
      } else {
        // Leaders and admins can see all reports
        // This would require implementing a more comprehensive filter method
        // For now, we'll get unassigned reports or all reports
        if (status === 'unassigned') {
          reports = await Report.findUnassigned(sector);
        } else if (escalated === 'true') {
          reports = await Report.findEscalated();
        } else {
          // Implement a general findAll method with filters
          reports = await Report.findUnassigned(); // Placeholder
        }
      }

      res.json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: reports.length
          }
        }
      });

    } catch (error) {
      console.error('Get all reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get report by ID
  async getReportById(req, res) {
    try {
      const { id } = req.params;

      const report = await Report.findById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Check if user can access this report
      if (req.user.role === 'worker' && report.reporter_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own reports'
        });
      }

      // Get team members for this report
      const teamMembers = await ReportTechnician.getTeamByReport(id);

      res.json({
        success: true,
        message: 'Report retrieved successfully',
        data: {
          report,
          teamMembers
        }
      });

    } catch (error) {
      console.error('Get report by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get reports by reporter (worker's own reports)
  async getReportsByReporter(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Check if user can access these reports
      if (req.user.role === 'worker' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Can only access your own reports'
        });
      }

      const offset = (page - 1) * limit;
      const reports = await Report.findByReporter(id, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: reports.length
          }
        }
      });

    } catch (error) {
      console.error('Get reports by reporter error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get unassigned reports
  async getUnassignedReports(req, res) {
    try {
      const { sector } = req.query;

      const reports = await Report.findUnassigned(sector);

      res.json({
        success: true,
        message: 'Unassigned reports retrieved successfully',
        data: {
          reports
        }
      });

    } catch (error) {
      console.error('Get unassigned reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get reports due today
  async getReportsDueToday(req, res) {
    try {
      const technicianId = req.user.role === 'technician' ? req.user.id : null;
      
      const reports = await Report.findDueToday(technicianId);

      res.json({
        success: true,
        message: 'Reports due today retrieved successfully',
        data: {
          reports
        }
      });

    } catch (error) {
      console.error('Get reports due today error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get escalated reports
  async getEscalatedReports(req, res) {
    try {
      const reports = await Report.findEscalated();

      res.json({
        success: true,
        message: 'Escalated reports retrieved successfully',
        data: {
          reports
        }
      });

    } catch (error) {
      console.error('Get escalated reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Assign report to technician
  async assignReport(req, res) {
    try {
      const { id } = req.params;
      const { technician_id } = req.body;

      const assignedReport = await Report.assignTo(id, technician_id);

      if (!assignedReport) {
        return res.status(400).json({
          success: false,
          message: 'Report not found or already assigned'
        });
      }

      // Update technician stats
      try {
        await TechnicianStats.updateOnReportAssignment(technician_id, assignedReport.sector);
      } catch (error) {
        console.warn('Failed to update technician stats:', error.message);
      }

      // Add technician to report team as main
      try {
        await ReportTechnician.addToTeam(id, technician_id, 'main');
      } catch (error) {
        console.warn('Failed to add to team:', error.message);
      }

      // Send notification
      try {
        await notificationService.notifyReportAssignment(assignedReport, technician_id);
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.json({
        success: true,
        message: 'Report assigned successfully',
        data: {
          report: assignedReport
        }
      });

    } catch (error) {
      console.error('Assign report error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Claim report (technician claims unassigned report)
  async claimReport(req, res) {
    try {
      const { id } = req.params;
      const technicianId = req.user.id;

      // Check if technician is available
      const isAvailable = await ReportTechnician.isTechnicianAvailable(technicianId);
      
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'You have reached the maximum number of active assignments'
        });
      }

      const claimedReport = await Report.assignTo(id, technicianId);

      if (!claimedReport) {
        return res.status(400).json({
          success: false,
          message: 'Report not found or already assigned'
        });
      }

      // Update technician stats
      try {
        await TechnicianStats.updateOnReportAssignment(technicianId, claimedReport.sector);
      } catch (error) {
        console.warn('Failed to update technician stats:', error.message);
      }

      // Add technician to report team as main
      try {
        await ReportTechnician.addToTeam(id, technicianId, 'main');
      } catch (error) {
        console.warn('Failed to add to team:', error.message);
      }

      res.json({
        success: true,
        message: 'Report claimed successfully',
        data: {
          report: claimedReport
        }
      });

    } catch (error) {
      console.error('Claim report error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update report status
  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Check if user can update this report
      const report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      if (req.user.role === 'technician' && report.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Can only update reports assigned to you'
        });
      }

      const updatedReport = await Report.updateStatus(id, status);

      if (!updatedReport) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update report status'
        });
      }

      // Update technician stats if completed
      if (status === 'completed' && report.assigned_to) {
        try {
          await TechnicianStats.updateOnReportCompletion(report.assigned_to, {
            sector: report.sector,
            safety_required: report.safety_required,
            breakdown_type: report.breakdown_type
          });
        } catch (error) {
          console.warn('Failed to update technician stats:', error.message);
        }
      }

      // Send notification
      try {
        await notificationService.notifyStatusUpdate(updatedReport);
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.json({
        success: true,
        message: 'Report status updated successfully',
        data: {
          report: updatedReport
        }
      });

    } catch (error) {
      console.error('Update report status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add technician to report team (call for help)
  async addTeamMember(req, res) {
    try {
      const { id } = req.params;
      const { technician_id, role = 'support' } = req.body;

      const teamMember = await ReportTechnician.addToTeam(id, technician_id, role);

      // Send notification
      try {
        await notificationService.notifyTeamAssignment(id, technician_id);
      } catch (error) {
        console.warn('Failed to send notification:', error.message);
      }

      res.json({
        success: true,
        message: 'Team member added successfully',
        data: {
          teamMember
        }
      });

    } catch (error) {
      console.error('Add team member error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Remove technician from report team
  async removeTeamMember(req, res) {
    try {
      const { id, technicianId } = req.params;

      const removedMember = await ReportTechnician.removeFromTeam(id, technicianId);

      if (!removedMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      res.json({
        success: true,
        message: 'Team member removed successfully'
      });

    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get report team members
  async getReportTeam(req, res) {
    try {
      const { id } = req.params;

      const teamMembers = await ReportTechnician.getTeamByReport(id);

      res.json({
        success: true,
        message: 'Report team retrieved successfully',
        data: {
          teamMembers
        }
      });

    } catch (error) {
      console.error('Get report team error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get report statistics
  async getReportStats(req, res) {
    try {
      const { startDate, endDate, sector } = req.query;

      const stats = await Report.getStatsBySector(startDate, endDate);

      res.json({
        success: true,
        message: 'Report statistics retrieved successfully',
        data: {
          stats
        }
      });

    } catch (error) {
      console.error('Get report stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get overdue reports
  async getOverdueReports(req, res) {
    try {
      const reports = await Report.findOverdue();

      res.json({
        success: true,
        message: 'Overdue reports retrieved successfully',
        data: {
          reports
        }
      });

    } catch (error) {
      console.error('Get overdue reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Archive old reports
  async archiveOldReports(req, res) {
    try {
      const { daysOld = 90 } = req.query;

      const archivedCount = await Report.archiveOldReports(parseInt(daysOld));

      res.json({
        success: true,
        message: `${archivedCount} reports archived successfully`,
        data: {
          archivedCount
        }
      });

    } catch (error) {
      console.error('Archive old reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ReportController();

