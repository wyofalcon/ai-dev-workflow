/**
 * Comprehensive tests for errorHandler.js
 * Target: 70%+ coverage on middleware/errorHandler.js
 * Tests Prisma, Firebase, JWT, Validation, Custom, and Generic errors
 */

// Mock logger BEFORE requiring errorHandler
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../utils/logger', () => mockLogger);

// NOW require errorHandler
const errorHandler = require('../middleware/errorHandler');

describe('errorHandler', () => {
  let req, res, next;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Reset mocks
    jest.clearAllMocks();

    // Create mock request, response, next
    req = {
      url: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  describe('Error Logging', () => {
    it('should log error with request details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Test error',
        stack: 'Error stack trace',
        url: '/api/test',
        method: 'POST',
        ip: '127.0.0.1',
      });
    });

    it('should log error even if no stack trace', () => {
      const error = new Error('Error without stack');
      delete error.stack;

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error without stack',
          stack: undefined,
        })
      );
    });

    it('should log error with different HTTP methods', () => {
      req.method = 'GET';
      const error = new Error('GET error');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should log error with different URLs', () => {
      req.url = '/api/users/123';
      const error = new Error('User error');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/users/123',
        })
      );
    });
  });

  describe('Prisma Errors', () => {
    describe('P2002 - Unique Constraint Violation', () => {
      it('should handle unique constraint error', () => {
        const error = new Error('Unique constraint failed');
        error.code = 'P2002';
        error.meta = { target: ['email'] };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Conflict',
          message: 'A record with this value already exists',
          field: ['email'],
        });
      });

      it('should handle unique constraint without meta field', () => {
        const error = new Error('Unique constraint failed');
        error.code = 'P2002';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Conflict',
          message: 'A record with this value already exists',
          field: undefined,
        });
      });

      it('should handle multiple field unique constraint', () => {
        const error = new Error('Unique constraint failed');
        error.code = 'P2002';
        error.meta = { target: ['email', 'username'] };

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            field: ['email', 'username'],
          })
        );
      });
    });

    describe('P2025 - Record Not Found', () => {
      it('should handle record not found error', () => {
        const error = new Error('Record to delete does not exist');
        error.code = 'P2025';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Not Found',
          message: 'The requested record was not found',
        });
      });

      it('should handle P2025 with metadata', () => {
        const error = new Error('Record to update not found');
        error.code = 'P2025';
        error.meta = { cause: 'Record not found' };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe('Other Prisma Errors', () => {
      it('should handle P2003 foreign key constraint error', () => {
        const error = new Error('Foreign key constraint failed');
        error.code = 'P2003';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Database Error',
          message: 'A database error occurred',
        });
      });

      it('should handle P1001 connection error', () => {
        const error = new Error("Can't reach database server");
        error.code = 'P1001';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Database Error',
          message: 'A database error occurred',
        });
      });

      it('should handle P2024 timeout error', () => {
        const error = new Error('Query timeout');
        error.code = 'P2024';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('should handle unknown Prisma error codes', () => {
        const error = new Error('Unknown Prisma error');
        error.code = 'P9999';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Database Error',
          message: 'A database error occurred',
        });
      });
    });
  });

  describe('Firebase Auth Errors', () => {
    it('should handle Firebase auth/user-not-found error', () => {
      const error = new Error('User not found');
      error.code = 'auth/user-not-found';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication Error',
        message: 'User not found',
        code: 'auth/user-not-found',
      });
    });

    it('should handle Firebase auth/id-token-expired error', () => {
      const error = new Error('Token expired');
      error.code = 'auth/id-token-expired';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication Error',
        message: 'Token expired',
        code: 'auth/id-token-expired',
      });
    });

    it('should handle Firebase auth/argument-error', () => {
      const error = new Error('Invalid argument');
      error.code = 'auth/argument-error';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication Error',
          code: 'auth/argument-error',
        })
      );
    });

    it('should handle Firebase auth/invalid-credential', () => {
      const error = new Error('Invalid credential');
      error.code = 'auth/invalid-credential';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle generic Firebase auth errors', () => {
      const error = new Error('Firebase auth error');
      error.code = 'auth/unknown-error';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication Error',
        message: 'Firebase auth error',
        code: 'auth/unknown-error',
      });
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid Token',
        message: 'The authentication token is invalid',
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token Expired',
        message: 'The authentication token has expired',
      });
    });

    it('should handle JsonWebTokenError with different message', () => {
      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid Token',
        message: 'The authentication token is invalid',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Validation failed',
        details: undefined,
      });
    });

    it('should handle ValidationError with details', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';
      error.details = {
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid input',
        details: {
          email: 'Email is required',
          password: 'Password must be at least 8 characters',
        },
      });
    });

    it('should handle ValidationError with array details', () => {
      const error = new Error('Multiple validation errors');
      error.name = 'ValidationError';
      error.details = ['Field1 is required', 'Field2 is invalid'];

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: ['Field1 is required', 'Field2 is invalid'],
        })
      );
    });
  });

  describe('Custom Application Errors', () => {
    it('should handle custom error with statusCode', () => {
      const error = new Error('Custom error');
      error.statusCode = 403;
      error.name = 'ForbiddenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ForbiddenError',
        message: 'Custom error',
      });
    });

    it('should handle custom 404 error', () => {
      const error = new Error('Resource not found');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error', // Error objects have name='Error' by default
        message: 'Resource not found',
      });
    });

    it('should handle custom 400 bad request', () => {
      const error = new Error('Bad request');
      error.statusCode = 400;
      error.name = 'BadRequestError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'BadRequestError',
        message: 'Bad request',
      });
    });

    it('should handle custom 429 rate limit error', () => {
      const error = new Error('Too many requests');
      error.statusCode = 429;
      error.name = 'RateLimitError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should use error name if provided', () => {
      const error = new Error('Payment required');
      error.statusCode = 402;
      error.name = 'PaymentRequiredError';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'PaymentRequiredError',
        message: 'Payment required',
      });
    });

    it('should use default Error name if not overridden', () => {
      const error = new Error('Some error');
      error.statusCode = 418;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Error', // Error objects have name='Error' by default
        message: 'Some error',
      });
    });
  });

  describe('Generic Errors (500)', () => {
    it('should return 500 for unhandled errors in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Unexpected error',
      });
    });

    it('should hide error message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive database error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should show error message in test environment', () => {
      process.env.NODE_ENV = 'test';
      const error = new Error('Test error message');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Test error message',
      });
    });

    it('should handle error with no message', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: '',
      });
    });

    it('should handle null error message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error();
      error.message = null;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('Error Priority/Precedence', () => {
    it('should prioritize Prisma error over custom statusCode', () => {
      const error = new Error('Conflict');
      error.code = 'P2002';
      error.statusCode = 500;
      error.meta = { target: ['email'] };

      errorHandler(error, req, res, next);

      // Should use Prisma handling (409) not custom statusCode (500)
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should prioritize Firebase error over custom statusCode', () => {
      const error = new Error('Auth error');
      error.code = 'auth/user-not-found';
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      // Should use Firebase handling (401) not custom statusCode (500)
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should prioritize JWT error over custom statusCode', () => {
      const error = new Error('JWT error');
      error.name = 'JsonWebTokenError';
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      // Should use JWT handling (401) not custom statusCode (500)
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should prioritize ValidationError over custom statusCode', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      // Should use Validation handling (400) not custom statusCode (500)
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle error with code but not starting with P or auth/', () => {
      const error = new Error('Some error');
      error.code = 'ECONNREFUSED';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle error with empty code', () => {
      const error = new Error('Error');
      error.code = '';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle error with no properties', () => {
      const error = new Error('Basic error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should not call next() after handling error', () => {
      const error = new Error('Test');

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error with statusCode 0', () => {
      const error = new Error('Zero status');
      error.statusCode = 0;

      errorHandler(error, req, res, next);

      // Should treat 0 as falsy and fall through to 500
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle very long error messages', () => {
      process.env.NODE_ENV = 'development';
      const longMessage = 'Error: '.repeat(1000);
      const error = new Error(longMessage);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: longMessage,
      });
    });

    it('should handle error with special characters in message', () => {
      const error = new Error('Error with <script>alert("xss")</script>');
      error.code = 'P2025';

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error with <script>alert("xss")</script>',
        })
      );
    });
  });

  describe('Request Context', () => {
    it('should log errors from different IPs', () => {
      req.ip = '192.168.1.100';
      const error = new Error('Test');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.100',
        })
      );
    });

    it('should handle missing req.ip', () => {
      delete req.ip;
      const error = new Error('Test');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: undefined,
        })
      );
    });

    it('should log different HTTP methods', () => {
      req.method = 'DELETE';
      const error = new Error('Delete error');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should log different URLs', () => {
      req.url = '/api/users/123/resumes/456';
      const error = new Error('Nested route error');

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/users/123/resumes/456',
        })
      );
    });
  });
});
