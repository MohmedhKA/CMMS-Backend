// Users Unit Tests

const request = require('supertest');
const app = require('../../src/app');
const { testUsers, apiTestData, helpers } = require('../fixtures/testData');

describe('Users Tests', () => {
  let testPool;

  beforeAll(async () => {
    testPool = await helpers.createTestConnection();
    await helpers.setupTestDatabase(testPool);
  });

  afterAll(async () => {
    await helpers.cleanupTestDatabase(testPool);
    await testPool.end();
  });

  describe('GET /api/users', () => {
    test('should get all users for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should get all users for technician leader', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    test('should reject access for regular technician', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get('/api/users')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    test('should support pagination', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get('/api/users?page=1&limit=2')
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.users.length).toBeLessThanOrEqual(2);
    });

    test('should support role filtering', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get('/api/users?role=technician')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('technician');
      });
    });

    test('should support search functionality', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get('/api/users?search=test_technician')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by ID for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUsers.technician.id);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    test('should allow user to get own profile', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUsers.technician.id);
    });

    test('should reject access to other user profile for regular user', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.worker.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent user', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .get('/api/users/550e8400-e29b-41d4-a716-446655440999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      const updateData = {
        username: 'updated_technician',
        device_token: 'updated_device_token'
      };
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(updateData.username);
      expect(response.body.data.user.device_token).toBe(updateData.device_token);
    });

    test('should allow user to update own profile', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.worker);
      const updateData = {
        username: 'updated_worker_self',
        device_token: 'self_updated_token'
      };
      
      const response = await authRequest
        .put(`/api/users/${testUsers.worker.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(updateData.username);
    });

    test('should reject role update by non-admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send({ role: 'admin' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject employee_id update', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send({ employee_id: 'NEW_ID' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate input data', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send({ username: 'a' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should soft delete user for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .delete(`/api/users/${testUsers.worker.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
    });

    test('should reject deletion by non-leader', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .delete(`/api/users/${testUsers.worker.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should prevent self-deletion', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .delete(`/api/users/${testUsers.admin.id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot delete yourself');
    });
  });

  describe('GET /api/users/role/:role', () => {
    test('should get users by role', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users/role/technician')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('technician');
      });
    });

    test('should reject invalid role', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users/role/invalid_role')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/stats', () => {
    test('should get user statistics', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalReports');
      expect(response.body.data.stats).toHaveProperty('completedReports');
      expect(response.body.data.stats).toHaveProperty('averageCompletionTime');
    });

    test('should allow user to view own stats', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/search', () => {
    test('should search users by username', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users/search?q=test_technician')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    test('should search users by employee_id', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users/search?q=TEST_TECH001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    test('should return empty results for non-matching search', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get('/api/users/search?q=nonexistent_user_xyz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(0);
    });
  });

  describe('PUT /api/users/:id/activate', () => {
    test('should activate user for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}/activate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User activated successfully');
    });

    test('should reject activation by non-leader', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.worker.id}/activate`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/deactivate', () => {
    test('should deactivate user for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}/deactivate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deactivated successfully');
    });
  });

  describe('PUT /api/users/:id/role', () => {
    test('should update user role for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.worker.id}/role`)
        .send({ role: 'technician' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('technician');
    });

    test('should reject role update by non-admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.worker.id}/role`)
        .send({ role: 'technician' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid role', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.worker.id}/role`)
        .send({ role: 'invalid_role' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/reports', () => {
    test('should get user reports', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/reports`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reports).toBeInstanceOf(Array);
    });

    test('should support report status filtering', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/reports?status=completed`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.reports.forEach(report => {
        expect(report.status).toBe('completed');
      });
    });
  });

  describe('GET /api/users/:id/assignments', () => {
    test('should get user current assignments', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/assignments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignments).toBeInstanceOf(Array);
    });

    test('should only show active assignments', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .get(`/api/users/${testUsers.technician.id}/assignments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.assignments.forEach(assignment => {
        expect(['noticed', 'working']).toContain(assignment.status);
      });
    });
  });

  describe('POST /api/users/bulk-create', () => {
    test('should bulk create users for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      const bulkUsers = [
        {
          username: 'bulk_user_1',
          employee_id: 'BULK_001',
          password: 'BulkUser1@123',
          role: 'worker'
        },
        {
          username: 'bulk_user_2',
          employee_id: 'BULK_002',
          password: 'BulkUser2@123',
          role: 'technician'
        }
      ];
      
      const response = await authRequest
        .post('/api/users/bulk-create')
        .send({ users: bulkUsers })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(2);
      expect(response.body.data.users).toHaveLength(2);
    });

    test('should handle partial failures in bulk create', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      const bulkUsers = [
        {
          username: 'valid_user',
          employee_id: 'VALID_001',
          password: 'ValidUser@123',
          role: 'worker'
        },
        {
          username: 'invalid_user',
          employee_id: testUsers.technician.employee_id, // Duplicate
          password: 'InvalidUser@123',
          role: 'worker'
        }
      ];
      
      const response = await authRequest
        .post('/api/users/bulk-create')
        .send({ users: bulkUsers })
        .expect(207); // Multi-status

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
    });
  });

  describe('PUT /api/users/:id/reset-password', () => {
    test('should reset user password for admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}/reset-password`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
      expect(response.body.data).toHaveProperty('temporaryPassword');
    });

    test('should reject password reset by non-admin', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technicianLeader);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}/reset-password`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate username length', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.admin);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send({ username: 'a' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate device token format', async () => {
      const authRequest = helpers.createAuthenticatedRequest(app, testUsers.technician);
      
      const response = await authRequest
        .put(`/api/users/${testUsers.technician.id}`)
        .send({ device_token: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

