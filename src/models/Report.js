const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Report {
  constructor(data) {
    this.id = data.id;
    this.reporter_id = data.reporter_id;
    this.breakdown_type = data.breakdown_type;
    this.description = data.description;
    this.safety_required = data.safety_required;
    this.assistance_required = data.assistance_required;
    this.location_method = data.location_method;
    this.sector = data.sector;
    this.grid_location = data.grid_location;
    this.machine_id = data.machine_id;
    this.image_url = data.image_url;
    this.status = data.status;
    this.assigned_to = data.assigned_to;
    this.sla_timer = data.sla_timer;
    this.escalated = data.escalated;
    this.created_at = data.created_at;
    this.completed_at = data.completed_at;
  }

  // Create a new report
  static async create(reportData) {
    const {
      reporter_id,
      breakdown_type,
      description,
      safety_required = false,
      assistance_required = false,
      location_method,
      sector,
      grid_location,
      machine_id,
      image_url
    } = reportData;

    const id = uuidv4();
    
    // Calculate SLA timer based on breakdown type and safety requirements
    const slaHours = this.calculateSLA(breakdown_type, safety_required);
    const sla_timer = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const queryText = `
      INSERT INTO reports (
        id, reporter_id, breakdown_type, description, safety_required,
        assistance_required, location_method, sector, grid_location,
        machine_id, image_url, status, sla_timer, escalated, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *
    `;

    const values = [
      id, reporter_id, breakdown_type, description, safety_required,
      assistance_required, location_method, sector, grid_location,
      machine_id, image_url, 'noticed', sla_timer, false
    ];

    const result = await query(queryText, values);
    return new Report(result.rows[0]);
  }

  // Calculate SLA based on breakdown type and safety requirements
  static calculateSLA(breakdown_type, safety_required) {
    if (safety_required) return 1; // 1 hour for safety issues
    
    switch (breakdown_type) {
      case 'electrical': return 4; // 4 hours
      case 'mechanical': return 8; // 8 hours
      case 'other': return 24; // 24 hours
      default: return 24;
    }
  }

  // Find report by ID
  static async findById(id) {
    const queryText = `
      SELECT r.*, 
             u1.username as reporter_name,
             u2.username as assigned_to_name,
             m.machine_label,
             m.qr_code_value
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.id = $1
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Report(result.rows[0]);
  }

  // Get reports by reporter
  static async findByReporter(reporterId, limit = 50, offset = 0) {
    const queryText = `
      SELECT r.*, 
             u.username as assigned_to_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u ON r.assigned_to = u.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await query(queryText, [reporterId, limit, offset]);
    return result.rows.map(row => new Report(row));
  }

  // Get reports by assigned technician
  static async findByAssignedTo(technicianId, status = null) {
    let queryText = `
      SELECT r.*, 
             u1.username as reporter_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.assigned_to = $1
    `;
    
    const values = [technicianId];
    
    if (status) {
      queryText += ' AND r.status = $2';
      values.push(status);
    }
    
    queryText += ' ORDER BY r.created_at DESC';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Report(row));
  }

  // Get unassigned reports
  static async findUnassigned(sector = null) {
    let queryText = `
      SELECT r.*, 
             u.username as reporter_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.assigned_to IS NULL AND r.status = 'noticed'
    `;
    
    const values = [];
    
    if (sector) {
      queryText += ' AND r.sector = $1';
      values.push(sector);
    }
    
    queryText += ' ORDER BY r.safety_required DESC, r.created_at ASC';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Report(row));
  }

  // Get reports due today
  static async findDueToday(technicianId = null) {
    let queryText = `
      SELECT r.*, 
             u1.username as reporter_name,
             u2.username as assigned_to_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE DATE(r.sla_timer) = CURRENT_DATE 
      AND r.status IN ('noticed', 'working')
    `;
    
    const values = [];
    
    if (technicianId) {
      queryText += ' AND r.assigned_to = $1';
      values.push(technicianId);
    }
    
    queryText += ' ORDER BY r.sla_timer ASC';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Report(row));
  }

  // Get escalated reports
  static async findEscalated() {
    const queryText = `
      SELECT r.*, 
             u1.username as reporter_name,
             u2.username as assigned_to_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.escalated = true AND r.status != 'completed'
      ORDER BY r.created_at ASC
    `;
    
    const result = await query(queryText);
    return result.rows.map(row => new Report(row));
  }

  // Assign report to technician
  static async assignTo(reportId, technicianId) {
    const queryText = `
      UPDATE reports 
      SET assigned_to = $1, status = 'working'
      WHERE id = $2 AND status = 'noticed'
      RETURNING *
    `;
    
    const result = await query(queryText, [technicianId, reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Report(result.rows[0]);
  }

  // Update report status
  static async updateStatus(reportId, status, technicianId = null) {
    let queryText = `
      UPDATE reports 
      SET status = $1
    `;
    
    const values = [status, reportId];
    
    if (status === 'completed') {
      queryText += ', completed_at = NOW()';
    }
    
    if (technicianId) {
      queryText += ', assigned_to = $3';
      values.splice(2, 0, technicianId);
    }
    
    queryText += ' WHERE id = $2 RETURNING *';
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Report(result.rows[0]);
  }

  // Mark report as escalated
  static async markEscalated(reportId) {
    const queryText = `
      UPDATE reports 
      SET escalated = true 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await query(queryText, [reportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Report(result.rows[0]);
  }

  // Get reports statistics by sector
  static async getStatsBySector(startDate = null, endDate = null) {
    let queryText = `
      SELECT 
        sector,
        breakdown_type,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN escalated = true THEN 1 END) as escalated_reports,
        AVG(CASE WHEN completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 
            END) as avg_completion_hours
      FROM reports
    `;
    
    const values = [];
    
    if (startDate && endDate) {
      queryText += ' WHERE created_at BETWEEN $1 AND $2';
      values.push(startDate, endDate);
    }
    
    queryText += ' GROUP BY sector, breakdown_type ORDER BY sector, breakdown_type';
    
    const result = await query(queryText, values);
    return result.rows;
  }

  // Get overdue reports
  static async findOverdue() {
    const queryText = `
      SELECT r.*, 
             u1.username as reporter_name,
             u2.username as assigned_to_name,
             m.machine_label
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      LEFT JOIN machine_map m ON r.machine_id = m.id
      WHERE r.sla_timer < NOW() 
      AND r.status IN ('noticed', 'working')
      AND r.escalated = false
      ORDER BY r.sla_timer ASC
    `;
    
    const result = await query(queryText);
    return result.rows.map(row => new Report(row));
  }

  // Archive old completed reports
  static async archiveOldReports(daysOld = 90) {
    const queryText = `
      UPDATE reports 
      SET status = 'archived' 
      WHERE status = 'completed' 
      AND completed_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING COUNT(*)
    `;
    
    const result = await query(queryText);
    return result.rows[0].count;
  }
}

module.exports = Report;

