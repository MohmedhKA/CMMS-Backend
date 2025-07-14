// API Integration Tests

const request = require('supertest');
const app = require('../../src/app');
const { testUsers, helpers } = require('../fixtures/testData');

describe('API Integration Tests', () => {
  let testPool;
  let authToken;

  beforeAll(async () => {
    testPool = await helpers.createTestConnection();
    await helpers.setupTestDatabase(testPool);
    
    // Get auth token for tests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        employee_id: testUsers.technician.employee_id,
        password: testUsers.technician.password
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await helpers.cleanupTestDatabase(testPool);
    await testPool.end();
  });

  describe('Complete Workflow Tests', () => {
    test('should complete report workflow', async () => {
      // 1. Create report
      const reportResponse = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          breakdown_type: 'mechanical',
          description: 'Integration test report',
          location_method: 'grid',
          sector: 'Test Sector',
          grid_location: 'A1-01'
        })
        .expect(201);

      const reportId = reportResponse.body.data.report.id;

      // 2. Update status
      await request(app)
        .put(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'working' })
        .expect(200);

      // 3. Complete report
      await request(app)
        .put(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      // 4. Verify completion
      const finalResponse = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.data.report.status).toBe('completed');
    });

    test('should handle part request workflow', async () => {
      // 1. Create part request
      const requestResponse = await request(app)
        .post('/api/parts/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          part_id: 'test-part-id',
          quantity_requested: 2,
          reason: 'Integration test request'
        })
        .expect(201);

      const requestId = requestResponse.body.data.request.id;

      // 2. Get pending requests
      const pendingResponse = await request(app)
        .get('/api/parts/requests/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(pendingResponse.body.data.requests).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reports')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should refresh token', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          employee_id: testUsers.technician.employee_id,
          password: testUsers.technician.password
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.token).toBeDefined();
    });
  });
});

