// Test Setup Configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

// Database configuration for tests
process.env.TEST_DB_HOST = process.env.DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.DB_PORT || '5432';
process.env.TEST_DB_NAME = 'cmms_test_db';
process.env.TEST_DB_USER = process.env.DB_USER || 'cmms_user';
process.env.TEST_DB_PASSWORD = process.env.DB_PASSWORD || 'password';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  generateRandomString: (length = 10) => Math.random().toString(36).substring(2, length + 2)
};

