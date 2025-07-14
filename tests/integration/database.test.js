// Database Integration Tests

const { helpers } = require('../fixtures/testData');

describe('Database Integration Tests', () => {
  let testPool;

  beforeAll(async () => {
    testPool = await helpers.createTestConnection();
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe('Database Connection', () => {
    test('should connect to database', async () => {
      const client = await testPool.connect();
      const result = await client.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
      client.release();
    });

    test('should have required tables', async () => {
      const client = await testPool.connect();
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const tableNames = result.rows.map(row => row.table_name);
      const requiredTables = ['users', 'reports', 'machine_map', 'parts'];
      
      requiredTables.forEach(table => {
        expect(tableNames).toContain(table);
      });
      
      client.release();
    });
  });

  describe('Database Operations', () => {
    test('should insert and retrieve data', async () => {
      const client = await testPool.connect();
      
      // Insert test data
      const insertResult = await client.query(`
        INSERT INTO users (username, employee_id, password_hash, role) 
        VALUES ('db_test_user', 'DB_TEST_001', 'test_hash', 'worker') 
        RETURNING id
      `);
      
      const userId = insertResult.rows[0].id;
      
      // Retrieve data
      const selectResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      expect(selectResult.rows[0].username).toBe('db_test_user');
      
      // Cleanup
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      client.release();
    });

    test('should handle transactions', async () => {
      const client = await testPool.connect();
      
      try {
        await client.query('BEGIN');
        
        await client.query(`
          INSERT INTO users (username, employee_id, password_hash, role) 
          VALUES ('transaction_test', 'TRANS_001', 'test_hash', 'worker')
        `);
        
        await client.query('ROLLBACK');
        
        const result = await client.query(
          'SELECT * FROM users WHERE employee_id = $1',
          ['TRANS_001']
        );
        
        expect(result.rows.length).toBe(0);
      } finally {
        client.release();
      }
    });
  });

  describe('Database Constraints', () => {
    test('should enforce unique constraints', async () => {
      const client = await testPool.connect();
      
      try {
        await client.query(`
          INSERT INTO users (username, employee_id, password_hash, role) 
          VALUES ('unique_test_1', 'UNIQUE_001', 'test_hash', 'worker')
        `);
        
        // This should fail due to unique constraint
        await expect(
          client.query(`
            INSERT INTO users (username, employee_id, password_hash, role) 
            VALUES ('unique_test_2', 'UNIQUE_001', 'test_hash', 'worker')
          `)
        ).rejects.toThrow();
        
      } finally {
        await client.query('DELETE FROM users WHERE employee_id = $1', ['UNIQUE_001']);
        client.release();
      }
    });

    test('should enforce foreign key constraints', async () => {
      const client = await testPool.connect();
      
      // This should fail due to foreign key constraint
      await expect(
        client.query(`
          INSERT INTO reports (reporter_id, breakdown_type, description, location_method, sector) 
          VALUES ('550e8400-e29b-41d4-a716-446655440999', 'mechanical', 'test', 'grid', 'test')
        `)
      ).rejects.toThrow();
      
      client.release();
    });
  });
});

