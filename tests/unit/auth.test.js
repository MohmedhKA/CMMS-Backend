// Authentication Unit Tests

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { testUsers, apiTestData, helpers } = require('../fixtures/testData');

describe('Authentication Tests', () => {
  let testPool;

  beforeAll(async () => {
    // Setup test database connection
    testPool = await helpers.createTestConnection();
    await helpers.setupTestDatabase(testPool);
  });

  afterAll(async () => {
    // Cleanup test database
    await helpers.cleanupTestDatabase(testPool);
    await testPool.end();
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(apiTestData.validLoginCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('employee_id');
      expect(response.body.data.user).toHaveProperty('role');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(apiTestData.invalidLoginCredentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.data).toBeUndefined();
    });

    test('should reject missing employee_id', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'TestPassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    test('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ employee_id: 'TEST_TECH001' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    test('should reject weak password format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          employee_id: 'TEST_TECH001',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new user with valid data (admin only)', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .post('/api/auth/register')
        .send(apiTestData.newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.username).toBe(apiTestData.newUserData.username);
      expect(response.body.data.user.employee_id).toBe(apiTestData.newUserData.employee_id);
      expect(response.body.data.user.role).toBe(apiTestData.newUserData.role);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    test('should reject registration without admin role', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .post('/api/auth/register')
        .send(apiTestData.newUserData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    test('should reject duplicate employee_id', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .post('/api/auth/register')
        .send({
          ...apiTestData.newUserData,
          employee_id: testUsers.technician.employee_id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should reject invalid role', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .post('/api/auth/register')
        .send({
          ...apiTestData.newUserData,
          role: 'invalid_role'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Get a valid refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(apiTestData.validLoginCredentials);
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    test('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    test('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get user profile with valid token', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/auth/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).toHaveProperty('employee_id');
      expect(response.body.data.user).toHaveProperty('role');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    test('should reject profile request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    test('should change password with valid current password', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put('/api/auth/change-password')
        .send({
          currentPassword: testUsers.technician.password,
          newPassword: 'NewTestPassword@123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    test('should reject password change with invalid current password', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewTestPassword@123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    test('should reject weak new password', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put('/api/auth/change-password')
        .send({
          currentPassword: testUsers.technician.password,
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/device-token', () => {
    test('should update device token successfully', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      const newDeviceToken = 'new_test_device_token_123';
      
      const response = await authRequest
        .put('/api/auth/device-token')
        .send({ deviceToken: newDeviceToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Device token updated successfully');
    });

    test('should reject invalid device token format', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put('/api/auth/device-token')
        .send({ deviceToken: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    test('should validate JWT token structure', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(apiTestData.validLoginCredentials);

      const token = loginResponse.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('employee_id');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { 
          id: testUsers.technician.id,
          employee_id: testUsers.technician.employee_id,
          role: testUsers.technician.role
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    test('should reject malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Password Security', () => {
    test('should hash passwords properly', () => {
      const password = 'TestPassword123';
      const hash = bcrypt.hashSync(password, 12);
      
      expect(hash).not.toBe(password);
      expect(bcrypt.compareSync(password, hash)).toBe(true);
      expect(bcrypt.compareSync('WrongPassword', hash)).toBe(false);
    });

    test('should enforce password complexity', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'password123',
        'PASSWORD123',
        'Pass@1'
      ];

      for (const weakPassword of weakPasswords) {
        const response = await authRequest
          .post('/api/auth/register')
          .send({
            ...apiTestData.newUserData,
            employee_id: `WEAK_${helpers.generateRandomString(5)}`,
            password: weakPassword
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to login attempts', async () => {
      const requests = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send(apiTestData.invalidLoginCredentials)
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(apiTestData.validLoginCredentials);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});

