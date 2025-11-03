// Test setup - must run BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// No global beforeAll/afterAll - those will be in individual test files
