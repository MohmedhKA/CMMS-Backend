const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.employee_id = data.employee_id;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.device_token = data.device_token;
    this.created_at = data.created_at;
  }

  // Create a new user
  static async create(userData) {
    const { username, employee_id, password, role, device_token } = userData;
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const id = uuidv4();
    
    const queryText = `
      INSERT INTO users (id, username, employee_id, password_hash, role, device_token, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    
    const values = [id, username, employee_id, password_hash, role, device_token];
    
    try {
      const result = await query(queryText, values);
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Employee ID already exists');
      }
      throw error;
    }
  }

  // Find user by employee ID
  static async findByEmployeeId(employee_id) {
    const queryText = 'SELECT * FROM users WHERE employee_id = $1';
    const result = await query(queryText, [employee_id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Get all users with pagination
  static async findAll(limit = 50, offset = 0, role = null) {
    let queryText = 'SELECT * FROM users';
    let values = [];
    
    if (role) {
      queryText += ' WHERE role = $1';
      values.push(role);
      queryText += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      values.push(limit, offset);
    } else {
      queryText += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      values.push(limit, offset);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new User(row));
  }

  // Get users by role
  static async findByRole(role) {
    const queryText = 'SELECT * FROM users WHERE role = $1 ORDER BY username';
    const result = await query(queryText, [role]);
    return result.rows.map(row => new User(row));
  }

  // Update user device token
  static async updateDeviceToken(userId, deviceToken) {
    const queryText = `
      UPDATE users 
      SET device_token = $1 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await query(queryText, [deviceToken, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Update user password
  static async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const queryText = `
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await query(queryText, [password_hash, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  // Delete user
  static async delete(userId) {
    const queryText = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await query(queryText, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Get user count by role
  static async getCountByRole() {
    const queryText = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
    
    const result = await query(queryText);
    return result.rows;
  }

  // Check if user has permission for action
  hasPermission(action) {
    const permissions = {
      'worker': ['create_report', 'view_own_reports'],
      'technician': ['view_reports', 'update_report_status', 'claim_report', 'order_parts'],
      'workers_leader': ['create_worker', 'view_worker_dashboard', 'view_all_reports'],
      'technician_leader': ['create_technician', 'view_technician_dashboard', 'assign_reports', 'view_all_reports'],
      'admin': ['*'] // Admin has all permissions
    };

    if (this.role === 'admin') {
      return true;
    }

    return permissions[this.role]?.includes(action) || false;
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;

