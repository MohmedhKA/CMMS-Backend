const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Machine {
  constructor(data) {
    this.id = data.id;
    this.qr_code_value = data.qr_code_value;
    this.machine_label = data.machine_label;
    this.sector = data.sector;
    this.grid_location = data.grid_location;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
  }

  // Create a new machine entry
  static async create(machineData) {
    const {
      qr_code_value,
      machine_label,
      sector,
      grid_location,
      created_by
    } = machineData;

    const id = uuidv4();

    const queryText = `
      INSERT INTO machine_map (id, qr_code_value, machine_label, sector, grid_location, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const values = [id, qr_code_value, machine_label, sector, grid_location, created_by];

    try {
      const result = await query(queryText, values);
      return new Machine(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('QR code value already exists');
      }
      throw error;
    }
  }

  // Find machine by QR code value
  static async findByQRCode(qr_code_value) {
    const queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.qr_code_value = $1
    `;
    
    const result = await query(queryText, [qr_code_value]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Machine(result.rows[0]);
  }

  // Find machine by ID
  static async findById(id) {
    const queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Machine(result.rows[0]);
  }

  // Get all machines with pagination
  static async findAll(limit = 50, offset = 0, sector = null) {
    let queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
    `;
    
    const values = [];
    
    if (sector) {
      queryText += ' WHERE m.sector = $1';
      values.push(sector);
      queryText += ' ORDER BY m.created_at DESC LIMIT $2 OFFSET $3';
      values.push(limit, offset);
    } else {
      queryText += ' ORDER BY m.created_at DESC LIMIT $1 OFFSET $2';
      values.push(limit, offset);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Machine(row));
  }

  // Get machines by sector
  static async findBySector(sector) {
    const queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.sector = $1
      ORDER BY m.grid_location, m.machine_label
    `;
    
    const result = await query(queryText, [sector]);
    return result.rows.map(row => new Machine(row));
  }

  // Get machines by grid location
  static async findByGridLocation(grid_location, sector = null) {
    let queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.grid_location = $1
    `;
    
    const values = [grid_location];
    
    if (sector) {
      queryText += ' AND m.sector = $2';
      values.push(sector);
    }
    
    queryText += ' ORDER BY m.machine_label';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Machine(row));
  }

  // Update machine information
  static async update(id, updateData) {
    const {
      machine_label,
      sector,
      grid_location
    } = updateData;

    const queryText = `
      UPDATE machine_map 
      SET machine_label = $1, sector = $2, grid_location = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [machine_label, sector, grid_location, id];

    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Machine(result.rows[0]);
  }

  // Delete machine
  static async delete(id) {
    // First check if machine is referenced in any reports
    const checkQuery = 'SELECT COUNT(*) FROM reports WHERE machine_id = $1';
    const checkResult = await query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('Cannot delete machine that has associated reports');
    }

    const queryText = 'DELETE FROM machine_map WHERE id = $1 RETURNING *';
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Machine(result.rows[0]);
  }

  // Get machine statistics
  static async getStatistics() {
    const queryText = `
      SELECT 
        COUNT(*) as total_machines,
        COUNT(DISTINCT sector) as total_sectors,
        COUNT(DISTINCT grid_location) as total_grid_locations,
        sector,
        COUNT(*) as machines_per_sector
      FROM machine_map
      GROUP BY sector
      ORDER BY machines_per_sector DESC
    `;
    
    const result = await query(queryText);
    return result.rows;
  }

  // Get machines with report counts
  static async findWithReportCounts(sector = null, startDate = null, endDate = null) {
    let queryText = `
      SELECT 
        m.*,
        u.username as created_by_name,
        COUNT(r.id) as total_reports,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_reports,
        COUNT(CASE WHEN r.escalated = true THEN 1 END) as escalated_reports,
        MAX(r.created_at) as last_report_date
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN reports r ON m.id = r.machine_id
    `;
    
    const values = [];
    const conditions = [];
    
    if (sector) {
      conditions.push('m.sector = $' + (values.length + 1));
      values.push(sector);
    }
    
    if (startDate && endDate) {
      conditions.push('(r.created_at BETWEEN $' + (values.length + 1) + ' AND $' + (values.length + 2) + ' OR r.created_at IS NULL)');
      values.push(startDate, endDate);
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += `
      GROUP BY m.id, m.qr_code_value, m.machine_label, m.sector, m.grid_location, m.created_by, m.created_at, u.username
      ORDER BY total_reports DESC, m.sector, m.grid_location
    `;
    
    const result = await query(queryText, values);
    return result.rows;
  }

  // Search machines by label or QR code
  static async search(searchTerm, sector = null) {
    let queryText = `
      SELECT m.*, u.username as created_by_name
      FROM machine_map m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE (
        LOWER(m.machine_label) LIKE LOWER($1) OR 
        LOWER(m.qr_code_value) LIKE LOWER($1) OR
        LOWER(m.grid_location) LIKE LOWER($1)
      )
    `;
    
    const values = [`%${searchTerm}%`];
    
    if (sector) {
      queryText += ' AND m.sector = $2';
      values.push(sector);
    }
    
    queryText += ' ORDER BY m.machine_label';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Machine(row));
  }

  // Get unique sectors
  static async getUniqueSectors() {
    const queryText = 'SELECT DISTINCT sector FROM machine_map ORDER BY sector';
    const result = await query(queryText);
    return result.rows.map(row => row.sector);
  }

  // Get unique grid locations for a sector
  static async getUniqueGridLocations(sector = null) {
    let queryText = 'SELECT DISTINCT grid_location FROM machine_map';
    const values = [];
    
    if (sector) {
      queryText += ' WHERE sector = $1';
      values.push(sector);
    }
    
    queryText += ' ORDER BY grid_location';
    
    const result = await query(queryText, values);
    return result.rows.map(row => row.grid_location);
  }

  // Bulk import machines
  static async bulkCreate(machinesData, created_by) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      const createdMachines = [];
      
      for (const machineData of machinesData) {
        const id = uuidv4();
        const queryText = `
          INSERT INTO machine_map (id, qr_code_value, machine_label, sector, grid_location, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
        `;
        
        const values = [
          id,
          machineData.qr_code_value,
          machineData.machine_label,
          machineData.sector,
          machineData.grid_location,
          created_by
        ];
        
        const result = await client.query(queryText, values);
        createdMachines.push(new Machine(result.rows[0]));
      }
      
      await client.query('COMMIT');
      return createdMachines;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Machine;

