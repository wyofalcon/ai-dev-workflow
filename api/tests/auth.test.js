// Set environment BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma Client BEFORE requiring any modules that use it
const mockUser = {
  id: 'user-123',
  firebaseUid: 'test-uid-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  photoUrl: 'https://example.com/photo.jpg',
  authProvider: 'google.com',
  subscriptionTier: 'free',
  resumesGenerated: 0,
  resumesLimit: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  profile: {
    findUnique: jest.fn(),
  },
  personalityTraits: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock Secret Manager
jest.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
    accessSecretVersion: jest.fn().mockResolvedValue([{
      payload: {
        data: Buffer.from(JSON.stringify({
          type: 'service_account',
          project_id: 'cvstomize-test',
          private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
          client_email: 'test@cvstomize-test.iam.gserviceaccount.com',
        }))
      }
    }])
  }))
}));

// Use global Firebase mock from setup.js (no need to mock again)
const request = require('supertest');
const admin = require('firebase-admin');

// Import app AFTER all mocks are set up
const { app } = require('../index');

describe('Authentication Endpoints', () => {
  let validToken;
  let mockFirebaseUser;

  beforeAll(() => {
    // Setup mock Firebase user
    mockFirebaseUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
      firebase: {
        sign_in_provider: 'google.com',
      },
    };

    validToken = 'mock-firebase-token-12345';
  });

  beforeEach(() => {
    // Reset mock call counts before each test
    jest.clearAllMocks();
    // Reconfigure Firebase mock after clearing
    global.mockVerifyIdToken.mockResolvedValue(mockFirebaseUser);
  });

  describe('POST /api/auth/register', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('No authentication token provided');
    });

    it('should return 401 with invalid Bearer format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should register new user with valid token', async () => {
      // Mock: user doesn't exist yet
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      // Mock: create returns new user
      mockPrismaClient.user.create.mockResolvedValue(mockUser);
      // Mock: audit log
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit-123' });

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(mockFirebaseUser.email);
      expect(response.body.user.subscriptionTier).toBe('free');
      expect(response.body.user.resumesLimit).toBe(1);
    });

    it('should return 200 if user already exists', async () => {
      // Mock: user already exists
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      // Mock: update last login
      mockPrismaClient.user.update.mockResolvedValue(mockUser);
      // Mock: audit log
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit-124' });

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('User already registered');
      expect(response.body.user).toHaveProperty('id');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return user profile with valid token', async () => {
      // Mock: user with profile
      const userWithProfile = {
        ...mockUser,
        profile: {
          id: 'profile-123',
          userId: 'user-123',
          fullName: 'Test User',
          phone: '+1234567890',
        },
        personalityTraits: {
          id: 'traits-123',
          userId: 'user-123',
          openness: 75,
          conscientiousness: 80,
        },
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(userWithProfile);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(mockFirebaseUser.email);
      expect(response.body.user).toHaveProperty('profile');
      expect(response.body.user).toHaveProperty('personalityTraits');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should successfully logout with valid token', async () => {
      // Mock: find user for audit log
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      // Mock: audit log
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit-125' });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.environment).toBeDefined();
    });
  });
});
