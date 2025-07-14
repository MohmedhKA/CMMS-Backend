const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ReportTechnician {
  constructor(data) {
    this.id = data.id;
    this.report_id = data.report_id;
    this.technician_id = data.technician_id;
    this.role = data.role;
    this.joined_at = data.joined_at;
    this.left_at = data.left_at;
    this.is_active = data.is_active;
  }

  // Add technician to report team
  static async addToTeam(reportId, technicianId, role = 'support') {
    const id = uuidv4();

    // Check if technician is already on the team
    const existingQuery = `
      SELECT * FROM report_technicians 
      WHERE report_id = $1 AND technician_id = $2 AND is_active = true
    `;
    
    const existingResult = await query(existingQuery, [reportId, technicianId]);
    
    if (existingResult.rows.length > 0) {
      throw new Error('Technician is already assigned to this report');
    }

    // Check team size limits based on report severity
    const teamSizeCheck = await this.checkTeamSizeLimit(reportId, role);
    if (!teamSizeCheck.allowed) {
      throw new Error(teamSizeCheck.message);
    }

    const queryText = `
      INSERT INTO report_technicians (id, report_id, technician_id, role, joined_at, is_active)
      VALUES ($1, $2, $3, $4, NOW(), true)
      RETURNING *
    `;

    const values = [id, reportId, technicianId, role];

    const result = await query(queryText, values);
    return new ReportTechnician(result.rows[0]);
  }

  // Check team size limits
  static async checkTeamSizeLimit(reportId, newRole) {
    // Get report details to check severity
    const reportQuery = `
      SELECT safety_required, breakdown_type 
      FROM reports 
      WHERE id = $1
    `;
    
    const reportResult = await query(reportQuery, [reportId]);
    
    if (reportResult.rows.length === 0) {
      return { allowed: false, message: 'Report not found' };
    }

    const report = reportResult.rows[0];
    const isHighSeverity = report.safety_required || report.breakdown_type === 'electrical';

    // Get current team size
    const teamQuery = `
      SELECT COUNT(*) as team_size, role
      FROM report_technicians 
      WHERE report_id = $1 AND is_active = true
      GROUP BY role
    `;
    
    const teamResult = await query(teamQuery, [reportId]);
    
    let currentTeamSize = 0;
    let hasLeader = false;
    
    teamResult.rows.forEach(row => {
      currentTeamSize += parseInt(row.count);
      if (row.role === 'leader') {
        hasLeader = true;
      }
    });

    // Define limits
    const maxTeamSize = isHighSeverity ? 5 : 2;
    
    // For high severity, team leader is automatically assigned
    if (isHighSeverity && !hasLeader && newRole !== 'leader') {
      return { 
        allowed: false, 
        message: 'High severity reports require a team leader to be assigned first' 
      };
    }

    if (currentTeamSize >= maxTeamSize) {
      return { 
        allowed: false, 
        message: `Team size limit reached (${maxTeamSize} for ${isHighSeverity ? 'high' : 'medium/low'} severity reports)` 
      };
    }

    return { allowed: true, message: 'Team assignment allowed' };
  }

  // Remove technician from report team
  static async removeFromTeam(reportId, technicianId) {
    const queryText = `
      UPDATE report_technicians 
      SET is_active = false, left_at = NOW()
      WHERE report_id = $1 AND technician_id = $2 AND is_active = true
      RETURNING *
    `;

    const result = await query(queryText, [reportId, technicianId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new ReportTechnician(result.rows[0]);
  }

  // Get team members for a report
  static async getTeamByReport(reportId) {
    const queryText = `
      SELECT 
        rt.*,
        u.username,
        u.employee_id,
        u.role as user_role
      FROM report_technicians rt
      LEFT JOIN users u ON rt.technician_id = u.id
      WHERE rt.report_id = $1 AND rt.is_active = true
      ORDER BY 
        CASE rt.role 
          WHEN 'main' THEN 1 
          WHEN 'leader' THEN 2 
          WHEN 'support' THEN 3 
        END,
        rt.joined_at
    `;

    const result = await query(queryText, [reportId]);
    return result.rows.map(row => new ReportTechnician(row));
  }

  // Get reports assigned to a technician (including team assignments)
  static async getReportsByTechnician(technicianId, includeCompleted = false) {
    let queryText = `
      SELECT 
        rt.*,
        r.description,
        r.breakdown_type,
        r.safety_required,
        r.sector,
        r.status,
        r.sla_timer,
        r.created_at as report_created_at,
        u.username as reporter_name
      FROM report_technicians rt
      LEFT JOIN reports r ON rt.report_id = r.id
      LEFT JOIN users u ON r.reporter_id = u.id
      WHERE rt.technician_id = $1 AND rt.is_active = true
    `;

    const values = [technicianId];

    if (!includeCompleted) {
      queryText += " AND r.status != 'completed'";
    }

    queryText += ' ORDER BY r.sla_timer ASC, rt.joined_at DESC';

    const result = await query(queryText, values);
    return result.rows.map(row => new ReportTechnician(row));
  }

  // Get technician workload (active assignments)
  static async getTechnicianWorkload(technicianId) {
    const queryText = `
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(CASE WHEN rt.role = 'main' THEN 1 END) as main_assignments,
        COUNT(CASE WHEN rt.role = 'leader' THEN 1 END) as leader_assignments,
        COUNT(CASE WHEN rt.role = 'support' THEN 1 END) as support_assignments,
        COUNT(CASE WHEN r.safety_required = true THEN 1 END) as high_severity_assignments
      FROM report_technicians rt
      LEFT JOIN reports r ON rt.report_id = r.id
      WHERE rt.technician_id = $1 
      AND rt.is_active = true 
      AND r.status IN ('noticed', 'working')
    `;

    const result = await query(queryText, [technicianId]);
    return result.rows[0];
  }

  // Check if technician is available for new assignment
  static async isTechnicianAvailable(technicianId, reportSeverity = 'low') {
    const workload = await this.getTechnicianWorkload(technicianId);
    
    // Define availability rules
    const maxMainAssignments = 3;
    const maxTotalAssignments = 5;
    
    // For high severity reports, check if technician has capacity
    if (reportSeverity === 'high') {
      return workload.total_assignments < maxTotalAssignments;
    }
    
    // For regular assignments, check main assignment limit
    return workload.main_assignments < maxMainAssignments && 
           workload.total_assignments < maxTotalAssignments;
  }

  // Get available technicians for assignment
  static async getAvailableTechnicians(sector = null, reportSeverity = 'low') {
    let queryText = `
      SELECT 
        u.id,
        u.username,
        u.employee_id,
        u.role,
        COALESCE(workload.total_assignments, 0) as current_workload,
        COALESCE(workload.main_assignments, 0) as main_assignments
      FROM users u
      LEFT JOIN (
        SELECT 
          rt.technician_id,
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN rt.role = 'main' THEN 1 END) as main_assignments
        FROM report_technicians rt
        LEFT JOIN reports r ON rt.report_id = r.id
        WHERE rt.is_active = true 
        AND r.status IN ('noticed', 'working')
        GROUP BY rt.technician_id
      ) workload ON u.id = workload.technician_id
      WHERE u.role IN ('technician', 'technician_leader')
    `;

    const values = [];

    // Add sector filter if specified
    if (sector) {
      // This would require additional logic to match technicians to sectors
      // For now, we'll include all technicians
    }

    queryText += `
      AND (
        (workload.main_assignments IS NULL OR workload.main_assignments < 3)
        AND (workload.total_assignments IS NULL OR workload.total_assignments < 5)
      )
      ORDER BY 
        COALESCE(workload.total_assignments, 0) ASC,
        u.role DESC
    `;

    const result = await query(queryText, values);
    return result.rows;
  }

  // Auto-assign team leader for high severity reports
  static async autoAssignTeamLeader(reportId) {
    // Get available team leaders
    const leadersQuery = `
      SELECT u.id
      FROM users u
      LEFT JOIN (
        SELECT 
          rt.technician_id,
          COUNT(*) as current_assignments
        FROM report_technicians rt
        LEFT JOIN reports r ON rt.report_id = r.id
        WHERE rt.is_active = true 
        AND r.status IN ('noticed', 'working')
        AND rt.role = 'leader'
        GROUP BY rt.technician_id
      ) workload ON u.id = workload.technician_id
      WHERE u.role = 'technician_leader'
      AND (workload.current_assignments IS NULL OR workload.current_assignments < 2)
      ORDER BY COALESCE(workload.current_assignments, 0) ASC
      LIMIT 1
    `;

    const result = await query(leadersQuery);
    
    if (result.rows.length > 0) {
      const leaderId = result.rows[0].id;
      return await this.addToTeam(reportId, leaderId, 'leader');
    }
    
    return null;
  }

  // Get team assignment history for a report
  static async getTeamHistory(reportId) {
    const queryText = `
      SELECT 
        rt.*,
        u.username,
        u.employee_id
      FROM report_technicians rt
      LEFT JOIN users u ON rt.technician_id = u.id
      WHERE rt.report_id = $1
      ORDER BY rt.joined_at DESC
    `;

    const result = await query(queryText, [reportId]);
    return result.rows.map(row => new ReportTechnician(row));
  }

  // Get team performance statistics
  static async getTeamStats(startDate, endDate) {
    const queryText = `
      SELECT 
        COUNT(DISTINCT rt.report_id) as total_team_reports,
        AVG(team_size.size) as avg_team_size,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_team_reports,
        AVG(CASE 
          WHEN r.completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (r.completed_at - r.created_at))/3600 
        END) as avg_completion_hours
      FROM report_technicians rt
      LEFT JOIN reports r ON rt.report_id = r.id
      LEFT JOIN (
        SELECT 
          report_id, 
          COUNT(*) as size
        FROM report_technicians 
        WHERE is_active = true
        GROUP BY report_id
      ) team_size ON rt.report_id = team_size.report_id
      WHERE rt.joined_at BETWEEN $1 AND $2
      AND rt.is_active = true
    `;

    const result = await query(queryText, [startDate, endDate]);
    return result.rows[0];
  }
}

module.exports = ReportTechnician;

