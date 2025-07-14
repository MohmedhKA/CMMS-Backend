// Parts Unit Tests

const request = require('supertest');
const app = require('../../src/app');
const { testUsers, helpers } = require('../fixtures/testData');

describe('Parts Tests', () => {
  let testPool;

  beforeAll(async () => {
    testPool = await helpers.createTestConnection();
    await helpers.setupTestDatabase(testPool);
  });

  afterAll(async () => {
    await helpers.cleanupTestDatabase(testPool);
    await testPool.end();
  });

  describe('GET /api/parts', () => {
    test('should get all parts', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/parts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/parts', () => {
    test('should create new part for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      const partData = {
        part_number: 'TEST-001',
        part_name: 'Test Part',
        category: 'Test Category',
        unit_price: 100.00,
        stock_quantity: 10,
        minimum_stock: 2
      };
      
      const response = await authRequest
        .post('/api/parts')
        .send(partData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.part.part_number).toBe(partData.part_number);
    });
  });

  describe('POST /api/parts/requests', () => {
    test('should create part request', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .post('/api/parts/requests')
        .send({
          part_id: 'test-part-id',
          quantity_requested: 2,
          reason: 'Test part request'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/parts/low-stock', () => {
    test('should get low stock parts', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/parts/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toBeInstanceOf(Array);
    });
  });
});

