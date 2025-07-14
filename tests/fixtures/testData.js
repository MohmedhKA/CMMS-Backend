// Test Data Fixtures for CMMS Backend Tests

const bcrypt = require('bcryptjs');

// Test Users
const testUsers = {
  admin: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'test_admin',
    employee_id: 'TEST_ADMIN',
    password: 'TestAdmin@123',
    password_hash: bcrypt.hashSync('TestAdmin@123', 12),
    role: 'admin',
    device_token: 'test_admin_device_token'
  },
  technicianLeader: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'test_tech_leader',
    employee_id: 'TEST_TL001',
    password: 'TestTechLeader@123',
    password_hash: bcrypt.hashSync('TestTechLeader@123', 12),
    role: 'technician_leader',
    device_token: 'test_tech_leader_device_token'
  },
  technician: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    username: 'test_technician',
    employee_id: 'TEST_TECH001',
    password: 'TestTechnician@123',
    password_hash: bcrypt.hashSync('TestTechnician@123', 12),
    role: 'technician',
    device_token: 'test_technician_device_token'
  },
  worker: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    username: 'test_worker',
    employee_id: 'TEST_WORK001',
    password: 'TestWorker@123',
    password_hash: bcrypt.hashSync('TestWorker@123', 12),
    role: 'worker',
    device_token: 'test_worker_device_token'
  },
  workerLeader: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    username: 'test_worker_leader',
    employee_id: 'TEST_WL001',
    password: 'TestWorkerLeader@123',
    password_hash: bcrypt.hashSync('TestWorkerLeader@123', 12),
    role: 'workers_leader',
    device_token: 'test_worker_leader_device_token'
  }
};

// Test Machines
const testMachines = {
  conveyorBelt: {
    id: '550e8400-e29b-41d4-a716-446655440101',
    qr_code_value: 'TEST_QR_001',
    machine_label: 'Test Conveyor Belt A1',
    sector: 'Test Production Line A',
    grid_location: 'TEST-A1-01',
    created_by: testUsers.admin.id
  },
  hydraulicPress: {
    id: '550e8400-e29b-41d4-a716-446655440102',
    qr_code_value: 'TEST_QR_002',
    machine_label: 'Test Hydraulic Press B1',
    sector: 'Test Production Line B',
    grid_location: 'TEST-B1-01',
    created_by: testUsers.admin.id
  },
  cncMachine: {
    id: '550e8400-e29b-41d4-a716-446655440103',
    qr_code_value: 'TEST_QR_003',
    machine_label: 'Test CNC Machine C1',
    sector: 'Test Production Line C',
    grid_location: 'TEST-C1-01',
    created_by: testUsers.admin.id
  }
};

// Test Parts
const testParts = {
  conveyorBelt: {
    id: '550e8400-e29b-41d4-a716-446655440201',
    part_number: 'TEST-BLT-001',
    part_name: 'Test Conveyor Belt 10m',
    description: 'Test heavy duty conveyor belt',
    category: 'Test Belts',
    manufacturer: 'Test BeltCorp',
    unit_price: 150.00,
    stock_quantity: 10,
    minimum_stock: 2,
    location: 'Test Warehouse A-1',
    is_active: true
  },
  hydraulicSeal: {
    id: '550e8400-e29b-41d4-a716-446655440202',
    part_number: 'TEST-HYD-001',
    part_name: 'Test Hydraulic Seal Kit',
    description: 'Test complete seal kit for hydraulic press',
    category: 'Test Hydraulics',
    manufacturer: 'Test HydroTech',
    unit_price: 75.50,
    stock_quantity: 5,
    minimum_stock: 2,
    location: 'Test Warehouse B-1',
    is_active: true
  },
  lowStockPart: {
    id: '550e8400-e29b-41d4-a716-446655440203',
    part_number: 'TEST-LOW-001',
    part_name: 'Test Low Stock Part',
    description: 'Test part with low stock for testing alerts',
    category: 'Test Emergency',
    manufacturer: 'Test Emergency Supply',
    unit_price: 200.00,
    stock_quantity: 1,
    minimum_stock: 5,
    location: 'Test Warehouse Emergency',
    is_active: true
  }
};

// Test Reports
const testReports = {
  mechanicalIssue: {
    id: '550e8400-e29b-41d4-a716-446655440301',
    reporter_id: testUsers.worker.id,
    breakdown_type: 'mechanical',
    description: 'Test conveyor belt making unusual noise and vibrating',
    safety_required: false,
    assistance_required: false,
    location_method: 'qr',
    sector: 'Test Production Line A',
    grid_location: null,
    machine_id: testMachines.conveyorBelt.id,
    image_url: '/uploads/test/test_image.jpg',
    status: 'noticed',
    assigned_to: null,
    escalated: false
  },
  electricalIssue: {
    id: '550e8400-e29b-41d4-a716-446655440302',
    reporter_id: testUsers.worker.id,
    breakdown_type: 'electrical',
    description: 'Test hydraulic press electrical panel showing error',
    safety_required: true,
    assistance_required: true,
    location_method: 'qr',
    sector: 'Test Production Line B',
    grid_location: null,
    machine_id: testMachines.hydraulicPress.id,
    image_url: null,
    status: 'working',
    assigned_to: testUsers.technician.id,
    escalated: false
  },
  completedReport: {
    id: '550e8400-e29b-41d4-a716-446655440303',
    reporter_id: testUsers.worker.id,
    breakdown_type: 'other',
    description: 'Test completed maintenance task',
    safety_required: false,
    assistance_required: false,
    location_method: 'grid',
    sector: 'Test Production Line C',
    grid_location: 'TEST-C1-01',
    machine_id: null,
    image_url: null,
    status: 'completed',
    assigned_to: testUsers.technician.id,
    escalated: false
  }
};

// Test Part Requests
const testPartRequests = {
  pendingRequest: {
    id: '550e8400-e29b-41d4-a716-446655440401',
    technician_id: testUsers.technician.id,
    part_id: testParts.conveyorBelt.id,
    quantity_requested: 2,
    quantity_approved: null,
    reason: 'Test part request for conveyor belt replacement',
    status: 'requested',
    approved_at: null,
    approved_by: null,
    delivered_at: null,
    notes: null
  },
  approvedRequest: {
    id: '550e8400-e29b-41d4-a716-446655440402',
    technician_id: testUsers.technician.id,
    part_id: testParts.hydraulicSeal.id,
    quantity_requested: 1,
    quantity_approved: 1,
    reason: 'Test approved part request for hydraulic seal',
    status: 'approved',
    approved_by: testUsers.technicianLeader.id,
    delivered_at: null,
    notes: 'Test approval notes'
  },
  deliveredRequest: {
    id: '550e8400-e29b-41d4-a716-446655440403',
    technician_id: testUsers.technician.id,
    part_id: testParts.conveyorBelt.id,
    quantity_requested: 1,
    quantity_approved: 1,
    reason: 'Test delivered part request',
    status: 'delivered',
    approved_by: testUsers.technicianLeader.id,
    notes: 'Test delivery completed'
  }
};

// Test Technician Stats
const testTechnicianStats = {
  currentMonth: {
    id: '550e8400-e29b-41d4-a716-446655440501',
    technician_id: testUsers.technician.id,
    sector: 'Test Production Line A',
    total_assigned: 10,
    total_completed: 8,
    high_severity_handled: 2,
    points: 65,
    time_window_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    time_window_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  },
  previousMonth: {
    id: '550e8400-e29b-41d4-a716-446655440502',
    technician_id: testUsers.technician.id,
    sector: 'Test Production Line A',
    total_assigned: 15,
    total_completed: 14,
    high_severity_handled: 3,
    points: 95,
    time_window_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    time_window_end: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
  }
};

// Test Report Technicians (Team Assignments)
const testReportTechnicians = {
  mainTechnician: {
    id: '550e8400-e29b-41d4-a716-446655440601',
    report_id: testReports.electricalIssue.id,
    technician_id: testUsers.technician.id,
    role: 'main',
    is_active: true,
    left_at: null
  },
  supportTechnician: {
    id: '550e8400-e29b-41d4-a716-446655440602',
    report_id: testReports.electricalIssue.id,
    technician_id: testUsers.technicianLeader.id,
    role: 'support',
    is_active: true,
    left_at: null
  }
};

// API Test Data
const apiTestData = {
  validLoginCredentials: {
    employee_id: testUsers.technician.employee_id,
    password: testUsers.technician.password
  },
  invalidLoginCredentials: {
    employee_id: 'INVALID_USER',
    password: 'InvalidPassword123'
  },
  newUserData: {
    username: 'new_test_user',
    employee_id: 'NEW_TEST_001',
    password: 'NewTestUser@123',
    role: 'worker'
  },
  newMachineData: {
    qr_code_value: 'NEW_TEST_QR_001',
    machine_label: 'New Test Machine',
    sector: 'New Test Sector',
    grid_location: 'NEW-TEST-01'
  },
  newPartData: {
    part_number: 'NEW-TEST-001',
    part_name: 'New Test Part',
    description: 'New test part description',
    category: 'New Test Category',
    manufacturer: 'New Test Manufacturer',
    unit_price: 100.00,
    stock_quantity: 20,
    minimum_stock: 5,
    location: 'New Test Location'
  },
  newReportData: {
    breakdown_type: 'mechanical',
    description: 'New test report description for testing API',
    safety_required: false,
    assistance_required: false,
    location_method: 'qr',
    sector: 'Test Production Line A',
    machine_id: testMachines.conveyorBelt.id
  },
  newPartRequestData: {
    part_id: testParts.conveyorBelt.id,
    quantity_requested: 3,
    reason: 'New test part request for API testing'
  }
};

// Database Cleanup Queries
const cleanupQueries = [
  'DELETE FROM report_technicians WHERE report_id IN (SELECT id FROM reports WHERE description LIKE \'Test%\' OR description LIKE \'New test%\')',
  'DELETE FROM part_requests WHERE technician_id IN (SELECT id FROM users WHERE employee_id LIKE \'TEST_%\' OR employee_id LIKE \'NEW_TEST_%\')',
  'DELETE FROM technician_stats WHERE technician_id IN (SELECT id FROM users WHERE employee_id LIKE \'TEST_%\' OR employee_id LIKE \'NEW_TEST_%\')',
  'DELETE FROM reports WHERE reporter_id IN (SELECT id FROM users WHERE employee_id LIKE \'TEST_%\' OR employee_id LIKE \'NEW_TEST_%\')',
  'DELETE FROM parts WHERE part_number LIKE \'TEST-%\' OR part_number LIKE \'NEW-TEST-%\'',
  'DELETE FROM machine_map WHERE qr_code_value LIKE \'TEST_%\' OR qr_code_value LIKE \'NEW_TEST_%\'',
  'DELETE FROM users WHERE employee_id LIKE \'TEST_%\' OR employee_id LIKE \'NEW_TEST_%\''
];

// Test Database Setup Queries
const setupQueries = [
  // Insert test users
  `INSERT INTO users (id, username, employee_id, password_hash, role, device_token, created_at, updated_at) VALUES 
   ('${testUsers.admin.id}', '${testUsers.admin.username}', '${testUsers.admin.employee_id}', '${testUsers.admin.password_hash}', '${testUsers.admin.role}', '${testUsers.admin.device_token}', NOW(), NOW()),
   ('${testUsers.technicianLeader.id}', '${testUsers.technicianLeader.username}', '${testUsers.technicianLeader.employee_id}', '${testUsers.technicianLeader.password_hash}', '${testUsers.technicianLeader.role}', '${testUsers.technicianLeader.device_token}', NOW(), NOW()),
   ('${testUsers.technician.id}', '${testUsers.technician.username}', '${testUsers.technician.employee_id}', '${testUsers.technician.password_hash}', '${testUsers.technician.role}', '${testUsers.technician.device_token}', NOW(), NOW()),
   ('${testUsers.worker.id}', '${testUsers.worker.username}', '${testUsers.worker.employee_id}', '${testUsers.worker.password_hash}', '${testUsers.worker.role}', '${testUsers.worker.device_token}', NOW(), NOW()),
   ('${testUsers.workerLeader.id}', '${testUsers.workerLeader.username}', '${testUsers.workerLeader.employee_id}', '${testUsers.workerLeader.password_hash}', '${testUsers.workerLeader.role}', '${testUsers.workerLeader.device_token}', NOW(), NOW())`,

  // Insert test machines
  `INSERT INTO machine_map (id, qr_code_value, machine_label, sector, grid_location, created_by, created_at, updated_at) VALUES 
   ('${testMachines.conveyorBelt.id}', '${testMachines.conveyorBelt.qr_code_value}', '${testMachines.conveyorBelt.machine_label}', '${testMachines.conveyorBelt.sector}', '${testMachines.conveyorBelt.grid_location}', '${testMachines.conveyorBelt.created_by}', NOW(), NOW()),
   ('${testMachines.hydraulicPress.id}', '${testMachines.hydraulicPress.qr_code_value}', '${testMachines.hydraulicPress.machine_label}', '${testMachines.hydraulicPress.sector}', '${testMachines.hydraulicPress.grid_location}', '${testMachines.hydraulicPress.created_by}', NOW(), NOW()),
   ('${testMachines.cncMachine.id}', '${testMachines.cncMachine.qr_code_value}', '${testMachines.cncMachine.machine_label}', '${testMachines.cncMachine.sector}', '${testMachines.cncMachine.grid_location}', '${testMachines.cncMachine.created_by}', NOW(), NOW())`,

  // Insert test parts
  `INSERT INTO parts (id, part_number, part_name, description, category, manufacturer, unit_price, stock_quantity, minimum_stock, location, is_active, created_at, updated_at) VALUES 
   ('${testParts.conveyorBelt.id}', '${testParts.conveyorBelt.part_number}', '${testParts.conveyorBelt.part_name}', '${testParts.conveyorBelt.description}', '${testParts.conveyorBelt.category}', '${testParts.conveyorBelt.manufacturer}', ${testParts.conveyorBelt.unit_price}, ${testParts.conveyorBelt.stock_quantity}, ${testParts.conveyorBelt.minimum_stock}, '${testParts.conveyorBelt.location}', ${testParts.conveyorBelt.is_active}, NOW(), NOW()),
   ('${testParts.hydraulicSeal.id}', '${testParts.hydraulicSeal.part_number}', '${testParts.hydraulicSeal.part_name}', '${testParts.hydraulicSeal.description}', '${testParts.hydraulicSeal.category}', '${testParts.hydraulicSeal.manufacturer}', ${testParts.hydraulicSeal.unit_price}, ${testParts.hydraulicSeal.stock_quantity}, ${testParts.hydraulicSeal.minimum_stock}, '${testParts.hydraulicSeal.location}', ${testParts.hydraulicSeal.is_active}, NOW(), NOW()),
   ('${testParts.lowStockPart.id}', '${testParts.lowStockPart.part_number}', '${testParts.lowStockPart.part_name}', '${testParts.lowStockPart.description}', '${testParts.lowStockPart.category}', '${testParts.lowStockPart.manufacturer}', ${testParts.lowStockPart.unit_price}, ${testParts.lowStockPart.stock_quantity}, ${testParts.lowStockPart.minimum_stock}, '${testParts.lowStockPart.location}', ${testParts.lowStockPart.is_active}, NOW(), NOW())`
];

// Helper Functions
const helpers = {
  // Generate JWT token for testing
  generateTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        id: user.id, 
        employee_id: user.employee_id, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  // Create test database connection
  createTestConnection: async () => {
    const { Pool } = require('pg');
    return new Pool({
      host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'cmms_test_db',
      user: process.env.TEST_DB_USER || process.env.DB_USER || 'cmms_user',
      password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'password'
    });
  },

  // Setup test database
  setupTestDatabase: async (pool) => {
    const client = await pool.connect();
    try {
      // Clean up existing test data
      for (const query of cleanupQueries) {
        await client.query(query);
      }
      
      // Insert test data
      for (const query of setupQueries) {
        await client.query(query);
      }
      
      console.log('Test database setup completed');
    } catch (error) {
      console.error('Test database setup failed:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Cleanup test database
  cleanupTestDatabase: async (pool) => {
    const client = await pool.connect();
    try {
      for (const query of cleanupQueries) {
        await client.query(query);
      }
      console.log('Test database cleanup completed');
    } catch (error) {
      console.error('Test database cleanup failed:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Create test request with authentication
  createAuthenticatedRequest: (app, user) => {
    const request = require('supertest');
    const token = helpers.generateTestToken(user);
    return request(app).set('Authorization', `Bearer ${token}`);
  },

  // Wait for async operations
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  generateRandomNumber: (min = 1, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

module.exports = {
  testUsers,
  testMachines,
  testParts,
  testReports,
  testPartRequests,
  testTechnicianStats,
  testReportTechnicians,
  apiTestData,
  cleanupQueries,
  setupQueries,
  helpers
};

