// Global Test Setup

module.exports = async () => {
  console.log('Setting up test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Additional global setup can be added here
  console.log('Test environment setup complete');
};

