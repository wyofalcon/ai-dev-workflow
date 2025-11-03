// Mock Firebase Admin BEFORE requiring the app
jest.mock('firebase-admin', () => {
  const mockVerifyIdToken = jest.fn();
  const mockAuth = {
    verifyIdToken: mockVerifyIdToken,
  };
  const mockApp = {
    auth: jest.fn(() => mockAuth),
  };

  return {
    apps: [],
    app: jest.fn(() => mockApp),
    initializeApp: jest.fn(() => mockApp),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(() => mockAuth),
    __mockAuth: mockAuth,
    __mockVerifyIdToken: mockVerifyIdToken,
  };
});

const request = require('supertest');
const admin = require('firebase-admin');

// Import app AFTER mocking Firebase
const { app } = require('../index');

describe('Authentication Endpoints', () => {
  let validToken;
  let mockFirebaseUser;

  beforeAll(async () => {
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

    // Configure the mock to return our test user
    admin.__mockVerifyIdToken.mockResolvedValue(mockFirebaseUser);

    validToken = 'mock-firebase-token-12345';
  }, 10000);

  afterAll(() => {
    jest.restoreAllMocks();
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
      // Second registration attempt
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
