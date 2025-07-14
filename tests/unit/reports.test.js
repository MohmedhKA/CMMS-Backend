// Reports Unit Tests

const request = require('supertest');
const app = require('../../src/app');
const { testUsers, helpers } = require('../fixtures/testData');

describe('Reports Tests', () => {
  let testPool;

  beforeAll(async () => {
    testPool = await helpers.createTestConnection();
    await helpers.setupTestDatabase(testPool);
  });

  afterAll(async () => {
    await helpers.cleanupTestDatabase(testPool);
    await testPool.end();
  });

  describe('POST /api/reports', () => {
    test('should create new report', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.worker);
      const reportData = {
        breakdown_type: 'mechanical',
        description: 'Test report description',
        safety_required: false,
        assistance_required: false,
        location_method: 'grid',
        sector: 'Test Sector',
        grid_location: 'A1-01'
      };
      
      const response = await authRequest
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toHaveProperty('id');
      expect(response.body.data.report.description).toBe(reportData.description);
    });

    test('should reject invalid breakdown type', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.worker);
      
      const response = await authRequest
        .post('/api/reports')
        .send({
          breakdown_type: 'invalid',
          description: 'Test description',
          location_method: 'grid',
          sector: 'Test Sector',
          grid_location: 'A1-01'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports', () => {
    test('should get all reports with pagination', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/reports')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should filter reports by status', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/reports?status=noticed')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/reports/:id/assign', () => {
    test('should assign report to technician', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      // First create a report
      const reportResponse = await helpers.createAuthenticatedRequest(app, testUsers.worker)
        .post('/api/reports')
        .send({
          breakdown_type: 'mechanical',
          description: 'Test assignment report',
          location_method: 'grid',
          sector: 'Test Sector',
          grid_location: 'A1-01'
        });

      const reportId = reportResponse.body.data.report.id;
      
      const response = await authRequest
        .put(`/api/reports/${reportId}/assign`)
        .send({ technician_id: testUsers.technician.id })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/reports/:id/status', () => {
    test('should update report status', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      // Create and assign report first
      const reportResponse = await helpers.createAuthenticatedRequest(app, testUsers.worker)
        .post('/api/reports')
        .send({
          breakdown_type: 'mechanical',
          description: 'Test status update',
          location_method: 'grid',
          sector: 'Test Sector',
          grid_location: 'A1-01'
        });

      const reportId = reportResponse.body.data.report.id;
      
      const response = await authRequest
        .put(`/api/reports/${reportId}/status`)
        .send({ status: 'working' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

