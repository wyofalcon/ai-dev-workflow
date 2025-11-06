/**
 * Comprehensive tests for authMiddleware.js
 * Target: 70%+ coverage on middleware/authMiddleware.js
 * Tests verifyFirebaseToken, requireSubscription, checkResumeLimit
 */

// Mock Firebase Admin SDK BEFORE requiring authMiddleware
const mockAdminApp = {
  name: '[DEFAULT]',
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
};

const mockAdmin = {
  apps: [mockAdminApp],
  app: jest.fn(() => mockAdminApp),
  credential: {
    cert: jest.fn(),
  },
};

jest.mock('firebase-admin', () => mockAdmin);

// Mock Prisma Client
const mockFindUnique = jest.fn();
const mockPrisma = {
  user: {
    findUnique: mockFindUnique,
  },
};

jest.mock('../config/database', () => mockPrisma);

// Mock Firebase config
const mockGetFirebaseAdmin = jest.fn(() => mockAdmin);
jest.mock('../config/firebase', () => ({
  getFirebaseAdmin: mockGetFirebaseAdmin,
}));

// NOW require the middleware
const {
  verifyFirebaseToken,
  requireSubscription,
  checkResumeLimit,
} = require('../middleware/authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request, response, next
    req = {
      headers: {},
      user: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyFirebaseToken', () => {
    let mockVerifyIdToken;

    beforeEach(() => {
      mockVerifyIdToken = jest.fn();
      mockAdmin.auth = jest.fn(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));
      mockGetFirebaseAdmin.mockReturnValue(mockAdmin);
    });

    describe('Success Cases', () => {
      it('should successfully verify valid token', async () => {
        req.headers.authorization = 'Bearer valid-token-123';

        mockVerifyIdToken.mockResolvedValue({
          uid: 'user-123',
          email: 'test@example.com',
          email_verified: true,
          name: 'Test User',
          picture: 'https://example.com/photo.jpg',
          firebase: {
            sign_in_provider: 'google.com',
          },
        });

        await verifyFirebaseToken(req, res, next);

        expect(mockGetFirebaseAdmin).toHaveBeenCalled();
        expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-123');
        expect(req.user).toEqual({
          firebaseUid: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
          displayName: 'Test User',
          photoUrl: 'https://example.com/photo.jpg',
          authProvider: 'google.com',
        });
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle token with email_verified undefined', async () => {
        req.headers.authorization = 'Bearer token';

        mockVerifyIdToken.mockResolvedValue({
          uid: 'user-456',
          email: 'user@test.com',
          firebase: {
            sign_in_provider: 'password',
          },
        });

        await verifyFirebaseToken(req, res, next);

        expect(req.user.emailVerified).toBe(false);
        expect(next).toHaveBeenCalled();
      });

      it('should extract token from Bearer header correctly', async () => {
        req.headers.authorization = 'Bearer my-complex-token.with.dots';

        mockVerifyIdToken.mockResolvedValue({
          uid: 'user-789',
          email: 'test@example.com',
          firebase: { sign_in_provider: 'google.com' },
        });

        await verifyFirebaseToken(req, res, next);

        expect(mockVerifyIdToken).toHaveBeenCalledWith('my-complex-token.with.dots');
        expect(next).toHaveBeenCalled();
      });

      it('should handle minimal token data', async () => {
        req.headers.authorization = 'Bearer token';

        mockVerifyIdToken.mockResolvedValue({
          uid: 'user-123',
          email: 'user@example.com',
          firebase: { sign_in_provider: 'password' },
        });

        await verifyFirebaseToken(req, res, next);

        expect(req.user).toEqual({
          firebaseUid: 'user-123',
          email: 'user@example.com',
          emailVerified: false,
          displayName: undefined,
          photoUrl: undefined,
          authProvider: 'password',
        });
        expect(next).toHaveBeenCalled();
      });
    });

    describe('Missing/Invalid Authorization Header', () => {
      it('should reject request with no authorization header', async () => {
        req.headers.authorization = undefined;

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        expect(next).not.toHaveBeenCalled();
        expect(mockVerifyIdToken).not.toHaveBeenCalled();
      });

      it('should reject request with empty authorization header', async () => {
        req.headers.authorization = '';

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject request without Bearer prefix', async () => {
        req.headers.authorization = 'Token abc123';

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject request with only "Bearer" and no token', async () => {
        req.headers.authorization = 'Bearer ';

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockVerifyIdToken).toHaveBeenCalledWith('');
      });
    });

    describe('Token Validation Errors', () => {
      it('should handle expired token error', async () => {
        req.headers.authorization = 'Bearer expired-token';

        const error = new Error('Token expired');
        error.code = 'auth/id-token-expired';
        mockVerifyIdToken.mockRejectedValue(error);

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Token Expired',
          message: 'Your authentication token has expired. Please sign in again.',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should handle invalid token format error', async () => {
        req.headers.authorization = 'Bearer invalid-format';

        const error = new Error('Invalid token format');
        error.code = 'auth/argument-error';
        mockVerifyIdToken.mockRejectedValue(error);

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Invalid Token',
          message: 'The authentication token is invalid or malformed.',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should handle generic Firebase auth error', async () => {
        req.headers.authorization = 'Bearer some-token';

        const error = new Error('Firebase auth failed');
        error.code = 'auth/unknown-error';
        mockVerifyIdToken.mockRejectedValue(error);

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Authentication Failed',
          message: 'Failed to authenticate request',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should handle error without error code', async () => {
        req.headers.authorization = 'Bearer token';

        mockVerifyIdToken.mockRejectedValue(new Error('Unknown error'));

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Authentication Failed',
          message: 'Failed to authenticate request',
        });
      });

      it('should handle network error from Firebase', async () => {
        req.headers.authorization = 'Bearer token';

        const error = new Error('Network error');
        error.code = 'network-error';
        mockVerifyIdToken.mockRejectedValue(error);

        await verifyFirebaseToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Authentication Failed',
          message: 'Failed to authenticate request',
        });
      });
    });
  });

  describe('requireSubscription', () => {
    beforeEach(() => {
      req.user = {
        firebaseUid: 'user-123',
        email: 'test@example.com',
      };
    });

    describe('Success Cases', () => {
      it('should allow user with matching subscription tier', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'pro',
        });

        const middleware = requireSubscription('pro', 'enterprise');
        await middleware(req, res, next);

        expect(mockFindUnique).toHaveBeenCalledWith({
          where: { firebaseUid: 'user-123' },
          select: { subscriptionTier: true },
        });
        expect(req.user.subscriptionTier).toBe('pro');
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should allow user with any of multiple allowed tiers', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'enterprise',
        });

        const middleware = requireSubscription('basic', 'pro', 'enterprise');
        await middleware(req, res, next);

        expect(req.user.subscriptionTier).toBe('enterprise');
        expect(next).toHaveBeenCalled();
      });

      it('should allow user with single allowed tier', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
        });

        const middleware = requireSubscription('basic');
        await middleware(req, res, next);

        expect(req.user.subscriptionTier).toBe('basic');
        expect(next).toHaveBeenCalled();
      });

      it('should attach subscription tier to req.user', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'pro',
        });

        const middleware = requireSubscription('pro');
        await middleware(req, res, next);

        expect(req.user).toHaveProperty('subscriptionTier', 'pro');
      });
    });

    describe('Forbidden Access', () => {
      it('should reject user with insufficient subscription tier', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
        });

        const middleware = requireSubscription('pro', 'enterprise');
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Forbidden',
          message: 'This feature requires a pro or enterprise subscription',
          currentTier: 'basic',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should show correct tier requirements in error message', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'free',
        });

        const middleware = requireSubscription('basic');
        await middleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          error: 'Forbidden',
          message: 'This feature requires a basic subscription',
          currentTier: 'free',
        });
      });

      it('should handle multiple tier requirements in message', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
        });

        const middleware = requireSubscription('pro', 'enterprise', 'unlimited');
        await middleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          error: 'Forbidden',
          message: 'This feature requires a pro or enterprise or unlimited subscription',
          currentTier: 'basic',
        });
      });
    });

    describe('User Not Found', () => {
      it('should reject request when user not found in database', async () => {
        mockFindUnique.mockResolvedValue(null);

        const middleware = requireSubscription('pro');
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'User Not Found',
          message: 'User account not found in database',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should pass database errors to error handler', async () => {
        const dbError = new Error('Database connection failed');
        mockFindUnique.mockRejectedValue(dbError);

        const middleware = requireSubscription('pro');
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle Prisma timeout error', async () => {
        const timeoutError = new Error('Query timeout');
        timeoutError.code = 'P2024';
        mockFindUnique.mockRejectedValue(timeoutError);

        const middleware = requireSubscription('basic');
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(timeoutError);
      });
    });
  });

  describe('checkResumeLimit', () => {
    beforeEach(() => {
      req.user = {
        firebaseUid: 'user-456',
        email: 'user@example.com',
      };
    });

    describe('Success Cases - Within Limit', () => {
      it('should allow user who has not reached limit', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
          resumesGenerated: 2,
          resumesLimit: 5,
        });

        await checkResumeLimit(req, res, next);

        expect(mockFindUnique).toHaveBeenCalledWith({
          where: { firebaseUid: 'user-456' },
          select: {
            subscriptionTier: true,
            resumesGenerated: true,
            resumesLimit: true,
          },
        });
        expect(req.user.resumesGenerated).toBe(2);
        expect(req.user.resumesLimit).toBe(5);
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should allow user with zero resumes generated', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'pro',
          resumesGenerated: 0,
          resumesLimit: 15,
        });

        await checkResumeLimit(req, res, next);

        expect(req.user.resumesGenerated).toBe(0);
        expect(req.user.resumesLimit).toBe(15);
        expect(next).toHaveBeenCalled();
      });

      it('should allow user one below limit', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
          resumesGenerated: 4,
          resumesLimit: 5,
        });

        await checkResumeLimit(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should attach resume counts to req.user', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'pro',
          resumesGenerated: 10,
          resumesLimit: 15,
        });

        await checkResumeLimit(req, res, next);

        expect(req.user).toHaveProperty('resumesGenerated', 10);
        expect(req.user).toHaveProperty('resumesLimit', 15);
      });
    });

    describe('Limit Reached', () => {
      it('should reject user who has exactly reached limit', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
          resumesGenerated: 5,
          resumesLimit: 5,
        });

        await checkResumeLimit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Limit Reached',
          message: 'You have reached your resume generation limit',
          currentCount: 5,
          limit: 5,
          subscriptionTier: 'basic',
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject user who has exceeded limit', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'basic',
          resumesGenerated: 10,
          resumesLimit: 5,
        });

        await checkResumeLimit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Limit Reached',
          message: 'You have reached your resume generation limit',
          currentCount: 10,
          limit: 5,
          subscriptionTier: 'basic',
        });
      });

      it('should include subscription tier in limit error', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'free',
          resumesGenerated: 3,
          resumesLimit: 3,
        });

        await checkResumeLimit(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            subscriptionTier: 'free',
          })
        );
      });

      it('should reject user with limit 0', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'suspended',
          resumesGenerated: 0,
          resumesLimit: 0,
        });

        await checkResumeLimit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('User Not Found', () => {
      it('should reject request when user not found', async () => {
        mockFindUnique.mockResolvedValue(null);

        await checkResumeLimit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'User Not Found',
          message: 'User account not found in database',
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should pass database errors to error handler', async () => {
        const dbError = new Error('Database error');
        mockFindUnique.mockRejectedValue(dbError);

        await checkResumeLimit(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle Prisma connection error', async () => {
        const connError = new Error('Connection refused');
        connError.code = 'P1001';
        mockFindUnique.mockRejectedValue(connError);

        await checkResumeLimit(req, res, next);

        expect(next).toHaveBeenCalledWith(connError);
      });

      it('should handle unexpected errors', async () => {
        mockFindUnique.mockRejectedValue(new Error('Unexpected error'));

        await checkResumeLimit(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large resume counts', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'unlimited',
          resumesGenerated: 1000000,
          resumesLimit: 999999999,
        });

        await checkResumeLimit(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should handle negative limits (edge case)', async () => {
        mockFindUnique.mockResolvedValue({
          subscriptionTier: 'test',
          resumesGenerated: 0,
          resumesLimit: -1,
        });

        await checkResumeLimit(req, res, next);

        // 0 >= -1 is true, so should reject
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with all three middleware in sequence', async () => {
      // Setup verifyFirebaseToken mock
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'user-integration',
        email: 'integration@test.com',
        firebase: { sign_in_provider: 'google.com' },
      });
      mockAdmin.auth = jest.fn(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));

      // Setup database mock
      mockFindUnique
        .mockResolvedValueOnce({
          subscriptionTier: 'pro',
        })
        .mockResolvedValueOnce({
          subscriptionTier: 'pro',
          resumesGenerated: 5,
          resumesLimit: 15,
        });

      // First: verifyFirebaseToken
      req.headers.authorization = 'Bearer valid-token';
      await verifyFirebaseToken(req, res, next);
      expect(req.user.firebaseUid).toBe('user-integration');

      // Second: requireSubscription
      const subMiddleware = requireSubscription('pro', 'enterprise');
      await subMiddleware(req, res, next);
      expect(req.user.subscriptionTier).toBe('pro');

      // Third: checkResumeLimit
      await checkResumeLimit(req, res, next);
      expect(req.user.resumesGenerated).toBe(5);
      expect(req.user.resumesLimit).toBe(15);

      // All should have succeeded
      expect(next).toHaveBeenCalledTimes(3);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should stop chain when token verification fails', async () => {
      const mockVerifyIdToken = jest.fn().mockRejectedValue(
        Object.assign(new Error('Token expired'), { code: 'auth/id-token-expired' })
      );
      mockAdmin.auth = jest.fn(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));

      req.headers.authorization = 'Bearer expired-token';
      await verifyFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should stop chain when subscription check fails', async () => {
      req.user = {
        firebaseUid: 'user-123',
        email: 'test@example.com',
      };

      mockFindUnique.mockResolvedValue({
        subscriptionTier: 'basic',
      });

      const middleware = requireSubscription('pro');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
