// Test setup - must run BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock UUID package (v13 uses ES modules which Jest can't handle)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

// Create shared Firebase mock that can be configured by tests
// This allows tests to set up verifyIdToken behavior
const mockVerifyIdToken = jest.fn();
const mockAuth = { verifyIdToken: mockVerifyIdToken };
const mockFirebaseApp = {
  auth: jest.fn(() => mockAuth)
};

// Mock Firebase Admin SDK - centralized for all tests
jest.mock('firebase-admin', () => ({
  apps: [],
  app: jest.fn(() => mockFirebaseApp),
  initializeApp: jest.fn(() => mockFirebaseApp),
  credential: {
    cert: jest.fn()
  },
  auth: jest.fn(() => mockAuth)
}));

// Mock Firebase config module to prevent Secret Manager calls
jest.mock('../config/firebase', () => ({
  initializeFirebase: jest.fn(async () => {
    // Return the mock app - the test will configure verifyIdToken
    return mockFirebaseApp;
  }),
  getFirebaseAdmin: jest.fn(() => require('firebase-admin'))
}));

// Mock Secret Manager to prevent real API calls
jest.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
    accessSecretVersion: jest.fn()
  }))
}));

// Export mock functions for tests to configure
global.mockVerifyIdToken = mockVerifyIdToken;
global.mockFirebaseApp = mockFirebaseApp;
global.mockAuth = mockAuth;

// No global beforeAll/afterAll - those will be in individual test files
