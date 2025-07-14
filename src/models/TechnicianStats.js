const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TechnicianStats {
  constructor(data) {
    this.id = data.id;
    this.technician_id = data.technician_id;
    this.sector = data.sector;
    this.total_assigned = data.total_assigned;
    this.total_completed = data.total_completed;
    this.high_severity_handled = data.high_severity_handled;
    this.points = data.points;
    this.time_window_start = data.time_window_start;
    this.time_window_end = data.time_window_end;
    this.created_at = data.created_at;
  }

  // Create new technician stats entry
  static async create(statsData) {
    const {
      technician_id,
      sector,
      total_assigned = 0,
      total_completed = 0,
      high_severity_handled = 0,
      points = 0,
      time_window_start,
      time_window_end
    } = statsData;

    const id = uuidv4();

    const queryText = `
      INSERT INTO technician_stats (
        id, technician_id, sector, total_assigned, total_completed,
        high_severity_handled, points, time_window_start, time_window_end, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;

    const values = [
      id, technician_id, sector, total_assigned, total_completed,
      high_severity_handled, points, time_window_start, time_window_end
    ];

    const result = await query(queryText, values);
    return new TechnicianStats(result.rows[0]);
  }

  // Get stats by technician ID
  static async findByTechnicianId(technicianId, limit = 12) {
    const queryText = `
      SELECT ts.*, u.username as technician_name
      FROM technician_stats ts
      LEFT JOIN users u ON ts.technician_id = u.id
      WHERE ts.technician_id = $1
      ORDER BY ts.time_window_start DESC
      LIMIT $2
    `;

    const result = await query(queryText, [technicianId, limit]);
    return result.rows.map(row => new TechnicianStats(row));
  }

  // Get current month stats for technician
  static async getCurrentMonthStats(technicianId) {
    const queryText = `
      SELECT ts.*, u.username as technician_name
      FROM technician_stats ts
      LEFT JOIN users u ON ts.technician_id = u.id
      WHERE ts.technician_id = $1
      AND ts.time_window_start <= NOW()
      AND ts.time_window_end >= NOW()
      ORDER BY ts.created_at DESC
      LIMIT 1
    `;

    const result = await query(queryText, [technicianId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new TechnicianStats(result.rows[0]);
  }

  // Get stats for all technicians in a time period
  static async findByTimePeriod(startDate, endDate, sector = null) {
    let queryText = `
      SELECT ts.*, u.username as technician_name, u.role
      FROM technician_stats ts
      LEFT JOIN users u ON ts.technician_id = u.id
      WHERE ts.time_window_start >= $1 AND ts.time_window_end <= $2
    `;

    const values = [startDate, endDate];

    if (sector) {
      queryText += ' AND ts.sector = $3';
      values.push(sector);
    }

    queryText += ' ORDER BY ts.points DESC, ts.total_completed DESC';

    const result = await query(queryText, values);
    return result.rows.map(row => new TechnicianStats(row));
  }

  // Get leaderboard for current month
  static async getLeaderboard(sector = null, limit = 10) {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    let queryText = `
      SELECT 
        ts.*,
        u.username as technician_name,
        u.role,
        RANK() OVER (ORDER BY ts.points DESC, ts.total_completed DESC) as rank
      FROM technician_stats ts
      LEFT JOIN users u ON ts.technician_id = u.id
      WHERE ts.time_window_start >= $1 AND ts.time_window_end <= $2
    `;

    const values = [startOfMonth, endOfMonth];

    if (sector) {
      queryText += ' AND ts.sector = $3';
      values.push(sector);
      queryText += ' ORDER BY ts.points DESC, ts.total_completed DESC LIMIT $4';
      values.push(limit);
    } else {
      queryText += ' ORDER BY ts.points DESC, ts.total_completed DESC LIMIT $3';
      values.push(limit);
    }

    const result = await query(queryText, values);
    return result.rows.map(row => new TechnicianStats(row));
  }

  // Update stats when report is completed
  static async updateOnReportCompletion(technicianId, reportData) {
    const { sector, safety_required, breakdown_type } = reportData;
    
    // Calculate points based on report characteristics
    let points = 10; // Base points
    if (safety_required) points += 20;
    if (breakdown_type === 'electrical') points += 15;
    else if (breakdown_type === 'mechanical') points += 10;

    // Get current month stats
    const currentStats = await this.getCurrentMonthStats(technicianId);
    
    if (currentStats) {
      // Update existing stats
      const queryText = `
        UPDATE technician_stats 
        SET 
          total_completed = total_completed + 1,
          high_severity_handled = high_severity_handled + $1,
          points = points + $2
        WHERE id = $3
        RETURNING *
      `;

      const highSeverityIncrement = safety_required ? 1 : 0;
      const values = [highSeverityIncrement, points, currentStats.id];

      const result = await query(queryText, values);
      return new TechnicianStats(result.rows[0]);
    } else {
      // Create new stats entry for current month
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      return await this.create({
        technician_id: technicianId,
        sector: sector,
        total_assigned: 0,
        total_completed: 1,
        high_severity_handled: safety_required ? 1 : 0,
        points: points,
        time_window_start: startOfMonth,
        time_window_end: endOfMonth
      });
    }
  }

  // Update stats when report is assigned
  static async updateOnReportAssignment(technicianId, sector) {
    const currentStats = await this.getCurrentMonthStats(technicianId);
    
    if (currentStats) {
      // Update existing stats
      const queryText = `
        UPDATE technician_stats 
        SET total_assigned = total_assigned + 1
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(queryText, [currentStats.id]);
      return new TechnicianStats(result.rows[0]);
    } else {
      // Create new stats entry for current month
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      return await this.create({
        technician_id: technicianId,
        sector: sector,
        total_assigned: 1,
        total_completed: 0,
        high_severity_handled: 0,
        points: 0,
        time_window_start: startOfMonth,
        time_window_end: endOfMonth
      });
    }
  }

  // Get aggregated stats for a technician
  static async getAggregatedStats(technicianId, months = 6) {
    const queryText = `
      SELECT 
        SUM(total_assigned) as total_assigned,
        SUM(total_completed) as total_completed,
        SUM(high_severity_handled) as high_severity_handled,
        SUM(points) as total_points,
        AVG(CASE WHEN total_assigned > 0 THEN (total_completed::float / total_assigned) * 100 ELSE 0 END) as completion_rate,
        COUNT(*) as months_active
      FROM technician_stats
      WHERE technician_id = $1
      AND time_window_start >= NOW() - INTERVAL '${months} months'
    `;

    const result = await query(queryText, [technicianId]);
    return result.rows[0];
  }

  // Get sector-wise performance
  static async getSectorPerformance(startDate, endDate) {
    const queryText = `
      SELECT 
        ts.sector,
        COUNT(DISTINCT ts.technician_id) as active_technicians,
        SUM(ts.total_assigned) as total_assigned,
        SUM(ts.total_completed) as total_completed,
        SUM(ts.high_severity_handled) as high_severity_handled,
        AVG(CASE WHEN ts.total_assigned > 0 THEN (ts.total_completed::float / ts.total_assigned) * 100 ELSE 0 END) as avg_completion_rate,
        SUM(ts.points) as total_points
      FROM technician_stats ts
      WHERE ts.time_window_start >= $1 AND ts.time_window_end <= $2
      GROUP BY ts.sector
      ORDER BY avg_completion_rate DESC, total_completed DESC
    `;

    const result = await query(queryText, [startDate, endDate]);
    return result.rows;
  }

  // Generate monthly stats for all technicians (background job)
  static async generateMonthlyStats(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all technicians
    const techniciansQuery = `
      SELECT id, role FROM users 
      WHERE role IN ('technician', 'technician_leader')
    `;
    
    const techniciansResult = await query(techniciansQuery);
    const technicians = techniciansResult.rows;

    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      for (const technician of technicians) {
        // Get reports data for this technician in the time period
        const reportsQuery = `
          SELECT 
            COUNT(*) as total_assigned,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed,
            COUNT(CASE WHEN safety_required = true AND status = 'completed' THEN 1 END) as high_severity_handled,
            sector
          FROM reports
          WHERE assigned_to = $1
          AND created_at >= $2 AND created_at <= $3
          GROUP BY sector
        `;

        const reportsResult = await client.query(reportsQuery, [technician.id, startDate, endDate]);
        
        for (const sectorData of reportsResult.rows) {
          // Calculate points
          const points = (sectorData.total_completed * 10) + (sectorData.high_severity_handled * 20);

          // Check if stats already exist for this period
          const existingQuery = `
            SELECT id FROM technician_stats
            WHERE technician_id = $1 AND sector = $2
            AND time_window_start = $3 AND time_window_end = $4
          `;

          const existingResult = await client.query(existingQuery, [
            technician.id, sectorData.sector, startDate, endDate
          ]);

          if (existingResult.rows.length === 0) {
            // Create new stats entry
            const insertQuery = `
              INSERT INTO technician_stats (
                id, technician_id, sector, total_assigned, total_completed,
                high_severity_handled, points, time_window_start, time_window_end, created_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `;

            await client.query(insertQuery, [
              uuidv4(),
              technician.id,
              sectorData.sector,
              parseInt(sectorData.total_assigned),
              parseInt(sectorData.total_completed),
              parseInt(sectorData.high_severity_handled),
              points,
              startDate,
              endDate
            ]);
          }
        }
      }
      
      await client.query('COMMIT');
      console.log(`Monthly stats generated for ${year}-${month}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get technician efficiency metrics
  static async getEfficiencyMetrics(technicianId, months = 3) {
    const queryText = `
      SELECT 
        ts.*,
        CASE 
          WHEN ts.total_assigned > 0 THEN (ts.total_completed::float / ts.total_assigned) * 100 
          ELSE 0 
        END as completion_rate,
        CASE 
          WHEN ts.total_completed > 0 THEN ts.points::float / ts.total_completed 
          ELSE 0 
        END as points_per_completion
      FROM technician_stats ts
      WHERE ts.technician_id = $1
      AND ts.time_window_start >= NOW() - INTERVAL '${months} months'
      ORDER BY ts.time_window_start DESC
    `;

    const result = await query(queryText, [technicianId]);
    return result.rows.map(row => new TechnicianStats(row));
  }
}

module.exports = TechnicianStats;

