const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Part {
  constructor(data) {
    this.id = data.id;
    this.part_number = data.part_number;
    this.part_name = data.part_name;
    this.description = data.description;
    this.category = data.category;
    this.manufacturer = data.manufacturer;
    this.unit_price = data.unit_price;
    this.stock_quantity = data.stock_quantity;
    this.minimum_stock = data.minimum_stock;
    this.location = data.location;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new part
  static async create(partData) {
    const {
      part_number,
      part_name,
      description,
      category,
      manufacturer,
      unit_price,
      stock_quantity = 0,
      minimum_stock = 0,
      location,
      is_active = true
    } = partData;

    const id = uuidv4();

    const queryText = `
      INSERT INTO parts (
        id, part_number, part_name, description, category, manufacturer,
        unit_price, stock_quantity, minimum_stock, location, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id, part_number, part_name, description, category, manufacturer,
      unit_price, stock_quantity, minimum_stock, location, is_active
    ];

    try {
      const result = await query(queryText, values);
      return new Part(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Part number already exists');
      }
      throw error;
    }
  }

  // Find part by ID
  static async findById(id) {
    const queryText = 'SELECT * FROM parts WHERE id = $1';
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Part(result.rows[0]);
  }

  // Find part by part number
  static async findByPartNumber(part_number) {
    const queryText = 'SELECT * FROM parts WHERE part_number = $1';
    const result = await query(queryText, [part_number]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Part(result.rows[0]);
  }

  // Get all parts with pagination
  static async findAll(limit = 50, offset = 0, category = null, is_active = true) {
    let queryText = 'SELECT * FROM parts WHERE is_active = $1';
    const values = [is_active];
    
    if (category) {
      queryText += ' AND category = $2';
      values.push(category);
      queryText += ' ORDER BY part_name LIMIT $3 OFFSET $4';
      values.push(limit, offset);
    } else {
      queryText += ' ORDER BY part_name LIMIT $2 OFFSET $3';
      values.push(limit, offset);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Part(row));
  }

  // Search parts by name, part number, or description
  static async search(searchTerm, category = null, is_active = true) {
    let queryText = `
      SELECT * FROM parts 
      WHERE is_active = $1 
      AND (
        LOWER(part_name) LIKE LOWER($2) OR 
        LOWER(part_number) LIKE LOWER($2) OR 
        LOWER(description) LIKE LOWER($2) OR
        LOWER(manufacturer) LIKE LOWER($2)
      )
    `;
    
    const values = [is_active, `%${searchTerm}%`];
    
    if (category) {
      queryText += ' AND category = $3';
      values.push(category);
    }
    
    queryText += ' ORDER BY part_name';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new Part(row));
  }

  // Get parts by category
  static async findByCategory(category, is_active = true) {
    const queryText = `
      SELECT * FROM parts 
      WHERE category = $1 AND is_active = $2
      ORDER BY part_name
    `;
    
    const result = await query(queryText, [category, is_active]);
    return result.rows.map(row => new Part(row));
  }

  // Get low stock parts
  static async findLowStock() {
    const queryText = `
      SELECT * FROM parts 
      WHERE stock_quantity <= minimum_stock 
      AND is_active = true
      ORDER BY (stock_quantity - minimum_stock), part_name
    `;
    
    const result = await query(queryText);
    return result.rows.map(row => new Part(row));
  }

  // Update part information
  static async update(id, updateData) {
    const {
      part_name,
      description,
      category,
      manufacturer,
      unit_price,
      stock_quantity,
      minimum_stock,
      location,
      is_active
    } = updateData;

    const queryText = `
      UPDATE parts 
      SET 
        part_name = $1,
        description = $2,
        category = $3,
        manufacturer = $4,
        unit_price = $5,
        stock_quantity = $6,
        minimum_stock = $7,
        location = $8,
        is_active = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      part_name, description, category, manufacturer, unit_price,
      stock_quantity, minimum_stock, location, is_active, id
    ];

    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Part(result.rows[0]);
  }

  // Update stock quantity
  static async updateStock(id, quantity, operation = 'set') {
    let queryText;
    
    if (operation === 'add') {
      queryText = `
        UPDATE parts 
        SET stock_quantity = stock_quantity + $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    } else if (operation === 'subtract') {
      queryText = `
        UPDATE parts 
        SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    } else {
      queryText = `
        UPDATE parts 
        SET stock_quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    }

    const result = await query(queryText, [quantity, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Part(result.rows[0]);
  }

  // Delete part (soft delete)
  static async delete(id) {
    const queryText = `
      UPDATE parts 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Part(result.rows[0]);
  }

  // Get unique categories
  static async getCategories() {
    const queryText = `
      SELECT DISTINCT category 
      FROM parts 
      WHERE is_active = true AND category IS NOT NULL
      ORDER BY category
    `;
    
    const result = await query(queryText);
    return result.rows.map(row => row.category);
  }

  // Get unique manufacturers
  static async getManufacturers() {
    const queryText = `
      SELECT DISTINCT manufacturer 
      FROM parts 
      WHERE is_active = true AND manufacturer IS NOT NULL
      ORDER BY manufacturer
    `;
    
    const result = await query(queryText);
    return result.rows.map(row => row.manufacturer);
  }

  // Get parts statistics
  static async getStatistics() {
    const queryText = `
      SELECT 
        COUNT(*) as total_parts,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_parts,
        COUNT(CASE WHEN stock_quantity <= minimum_stock AND is_active = true THEN 1 END) as low_stock_parts,
        COUNT(CASE WHEN stock_quantity = 0 AND is_active = true THEN 1 END) as out_of_stock_parts,
        COUNT(DISTINCT category) as total_categories,
        SUM(CASE WHEN is_active = true THEN stock_quantity * unit_price ELSE 0 END) as total_inventory_value
      FROM parts
    `;
    
    const result = await query(queryText);
    return result.rows[0];
  }

  // Bulk update stock quantities
  static async bulkUpdateStock(updates) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');
      
      const updatedParts = [];
      
      for (const update of updates) {
        const { id, quantity, operation = 'set' } = update;
        
        let queryText;
        if (operation === 'add') {
          queryText = `
            UPDATE parts 
            SET stock_quantity = stock_quantity + $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
        } else if (operation === 'subtract') {
          queryText = `
            UPDATE parts 
            SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
        } else {
          queryText = `
            UPDATE parts 
            SET stock_quantity = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
        }
        
        const result = await client.query(queryText, [quantity, id]);
        if (result.rows.length > 0) {
          updatedParts.push(new Part(result.rows[0]));
        }
      }
      
      await client.query('COMMIT');
      return updatedParts;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Part Request Model
class PartRequest {
  constructor(data) {
    this.id = data.id;
    this.technician_id = data.technician_id;
    this.part_id = data.part_id;
    this.quantity_requested = data.quantity_requested;
    this.quantity_approved = data.quantity_approved;
    this.reason = data.reason;
    this.status = data.status;
    this.requested_at = data.requested_at;
    this.approved_at = data.approved_at;
    this.approved_by = data.approved_by;
    this.delivered_at = data.delivered_at;
    this.notes = data.notes;
  }

  // Create a new part request
  static async create(requestData) {
    const {
      technician_id,
      part_id,
      quantity_requested,
      reason
    } = requestData;

    const id = uuidv4();

    const queryText = `
      INSERT INTO part_requests (
        id, technician_id, part_id, quantity_requested, reason, status, requested_at
      )
      VALUES ($1, $2, $3, $4, $5, 'requested', NOW())
      RETURNING *
    `;

    const values = [id, technician_id, part_id, quantity_requested, reason];

    const result = await query(queryText, values);
    return new PartRequest(result.rows[0]);
  }

  // Find request by ID
  static async findById(id) {
    const queryText = `
      SELECT 
        pr.*,
        u1.username as technician_name,
        u2.username as approved_by_name,
        p.part_name,
        p.part_number
      FROM part_requests pr
      LEFT JOIN users u1 ON pr.technician_id = u1.id
      LEFT JOIN users u2 ON pr.approved_by = u2.id
      LEFT JOIN parts p ON pr.part_id = p.id
      WHERE pr.id = $1
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new PartRequest(result.rows[0]);
  }

  // Get requests by technician
  static async findByTechnician(technicianId, status = null) {
    let queryText = `
      SELECT 
        pr.*,
        p.part_name,
        p.part_number,
        u.username as approved_by_name
      FROM part_requests pr
      LEFT JOIN parts p ON pr.part_id = p.id
      LEFT JOIN users u ON pr.approved_by = u.id
      WHERE pr.technician_id = $1
    `;
    
    const values = [technicianId];
    
    if (status) {
      queryText += ' AND pr.status = $2';
      values.push(status);
    }
    
    queryText += ' ORDER BY pr.requested_at DESC';
    
    const result = await query(queryText, values);
    return result.rows.map(row => new PartRequest(row));
  }

  // Get all requests with pagination
  static async findAll(limit = 50, offset = 0, status = null) {
    let queryText = `
      SELECT 
        pr.*,
        u1.username as technician_name,
        u2.username as approved_by_name,
        p.part_name,
        p.part_number
      FROM part_requests pr
      LEFT JOIN users u1 ON pr.technician_id = u1.id
      LEFT JOIN users u2 ON pr.approved_by = u2.id
      LEFT JOIN parts p ON pr.part_id = p.id
    `;
    
    const values = [];
    
    if (status) {
      queryText += ' WHERE pr.status = $1';
      values.push(status);
      queryText += ' ORDER BY pr.requested_at DESC LIMIT $2 OFFSET $3';
      values.push(limit, offset);
    } else {
      queryText += ' ORDER BY pr.requested_at DESC LIMIT $1 OFFSET $2';
      values.push(limit, offset);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new PartRequest(row));
  }

  // Approve/reject request
  static async updateStatus(id, status, approved_by, quantity_approved = null, notes = null) {
    let queryText = `
      UPDATE part_requests 
      SET status = $1, approved_by = $2, approved_at = NOW()
    `;
    
    const values = [status, approved_by, id];
    
    if (quantity_approved !== null) {
      queryText += ', quantity_approved = $4';
      values.splice(3, 0, quantity_approved);
    }
    
    if (notes !== null) {
      queryText += ', notes = $' + (values.length);
      values.splice(-1, 0, notes);
    }
    
    queryText += ' WHERE id = $' + values.length + ' RETURNING *';
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new PartRequest(result.rows[0]);
  }

  // Mark as delivered
  static async markDelivered(id) {
    const queryText = `
      UPDATE part_requests 
      SET status = 'delivered', delivered_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new PartRequest(result.rows[0]);
  }
}

module.exports = { Part, PartRequest };

