// tests/setup.js

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.NODE_ENV = 'test';

// Global test timeout
process.env.VITEST_TIMEOUT = '10000';