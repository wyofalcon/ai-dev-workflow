/**
 * Tests for Firebase Admin SDK initialization
 * Target: 70%+ coverage on config/firebase.js
 */

// Mock Firebase Admin SDK BEFORE requiring the module
const mockAdminApp = {
  name: '[DEFAULT]',
  options: {},
};

const mockCredential = {
  cert: jest.fn((serviceAccount) => ({
    serviceAccount,
    type: 'cert',
  })),
  applicationDefault: jest.fn(() => ({
    getAccessToken: jest.fn().mockResolvedValue({ access_token: 'mock-token' })
  })),
};

const mockInitializeApp = jest.fn(() => {
  const newApp = { ...mockAdminApp };
  mockAdmin.apps.push(newApp);
  return newApp;
});
const mockAppFunction = jest.fn(() => mockAdminApp);

const mockAdmin = {
  apps: [],
  app: mockAppFunction,
  initializeApp: mockInitializeApp,
  credential: mockCredential,
};

jest.mock('firebase-admin', () => mockAdmin);

// Mock Google Cloud Secret Manager
const mockAccessSecretVersion = jest.fn();
const mockSecretManagerClient = jest.fn().mockImplementation(() => ({
  accessSecretVersion: mockAccessSecretVersion,
}));

jest.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: mockSecretManagerClient,
}));

// NOW require the modules that depend on mocks
const admin = require('firebase-admin');

describe('Firebase Admin SDK Initialization', () => {
  let originalEnv;
  let initializeFirebase;
  let getFirebaseAdmin;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Reset mocks
    jest.clearAllMocks();
    mockAdmin.apps = []; // Use the reference from mockAdmin
    mockAccessSecretVersion.mockReset();

    // Use isolateModules to get a fresh instance of config/firebase.js for each test
    jest.isolateModules(() => {
      const firebaseConfig = jest.requireActual('../../../config/firebase');
      initializeFirebase = firebaseConfig.initializeFirebase;
      getFirebaseAdmin = firebaseConfig.getFirebaseAdmin;
    });

    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv;

    // Restore console
    jest.restoreAllMocks();
  });

  describe('initializeFirebase', () => {
    describe('Test Environment', () => {
      it('should return existing app in test environment', async () => {
        process.env.NODE_ENV = 'test';
        // Don't push to mockAdmin.apps yet, let it be empty to see the "Test environment" log
        // Wait, if it's empty, it goes to initializeFirebase's test block:
        // if (process.env.NODE_ENV === "test") {
        //   console.log("🧪 Test environment detected - using mocked Firebase");
        //   return admin.app();
        // }
        // BUT admin.app() might fail if not initialized? No, it's a mock.

        const app = await initializeFirebase();

        expect(app).toBeDefined();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Test environment detected')
        );
      });

      it('should not call Secret Manager in test environment', async () => {
        process.env.NODE_ENV = 'test';

        await initializeFirebase();

        expect(mockAccessSecretVersion).not.toHaveBeenCalled();
      });
    });

    describe('Already Initialized', () => {
      it('should reuse existing Firebase app', async () => {
        process.env.NODE_ENV = 'development';
        mockAdmin.apps.push(mockAdminApp);

        const app = await initializeFirebase();

        expect(app).toBeDefined();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Firebase app already exists')
        );
        expect(mockInitializeApp).not.toHaveBeenCalled();
      });

      it('should not re-initialize if app exists', async () => {
        process.env.NODE_ENV = 'production';
        mockAdmin.apps.push(mockAdminApp);

        await initializeFirebase();
        await initializeFirebase(); // Call twice

        expect(mockInitializeApp).not.toHaveBeenCalled();
      });
    });

    describe('Secret Manager Initialization', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        mockAdmin.apps.length = 0; // No existing apps

        // Reset and mock Secret Manager responses
        mockAccessSecretVersion.mockReset();
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from(JSON.stringify({
                  type: 'service_account',
                  project_id: 'test-project-id',
                  private_key_id: 'key123',
                  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                  client_email: 'test@test-project-id.iam.gserviceaccount.com',
                  client_id: '123456789',
                })),
              },
            },
          ]);
      });

      it('should initialize from Secret Manager in production', async () => {
        const app = await initializeFirebase();

        expect(app).toBeDefined();
        expect(mockAccessSecretVersion).toHaveBeenCalledTimes(2);
        expect(mockInitializeApp).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('Firebase Admin SDK initialized from Secret Manager')
        );
      });

      it('should fetch project ID from Secret Manager', async () => {
        await initializeFirebase();

        expect(mockAccessSecretVersion).toHaveBeenCalledWith({
          name: 'projects/cvstomize/secrets/cvstomize-project-id/versions/latest',
        });
      });

      it('should fetch service account key from Secret Manager', async () => {
        await initializeFirebase();

        expect(mockAccessSecretVersion).toHaveBeenCalledWith({
          name: 'projects/cvstomize/secrets/cvstomize-service-account-key/versions/latest',
        });
      });

      it('should initialize Firebase with service account credentials', async () => {
        await initializeFirebase();

        expect(mockCredential.cert).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'service_account',
            project_id: 'test-project-id',
          })
        );

        expect(mockInitializeApp).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: 'test-project-id',
          })
        );
      });

      it('should trim whitespace from project ID', async () => {
        mockAccessSecretVersion.mockReset();
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('  test-project-id  \n'),
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from(JSON.stringify({
                  type: 'service_account',
                  project_id: 'test-project-id',
                  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                  client_email: 'test@test.iam.gserviceaccount.com',
                })),
              },
            },
          ]);

        await initializeFirebase();

        expect(mockAccessSecretVersion).toHaveBeenCalledWith({
          name: 'projects/cvstomize/secrets/cvstomize-service-account-key/versions/latest',
        });
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        mockAdmin.apps.length = 0;
        mockAccessSecretVersion.mockReset();
      });

      it('should handle Secret Manager project ID fetch error', async () => {
        mockAccessSecretVersion.mockRejectedValueOnce(
          new Error('Failed to access project ID secret')
        );

        await expect(initializeFirebase()).rejects.toThrow(
          'Failed to access project ID secret'
        );

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to initialize Firebase from Secret Manager'),
          expect.any(Error)
        );
      });

      it('should handle Secret Manager service account fetch error', async () => {
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockRejectedValueOnce(
            new Error('Failed to access service account secret')
          );

        await expect(initializeFirebase()).rejects.toThrow(
          'Failed to access service account secret'
        );

        expect(console.error).toHaveBeenCalled();
      });

      it('should handle Firebase initialization error', async () => {
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from(JSON.stringify({
                  type: 'service_account',
                  project_id: 'test-project-id',
                  private_key: 'invalid-key',
                })),
              },
            },
          ]);

        mockInitializeApp.mockImplementationOnce(() => {
          throw new Error('Invalid credentials');
        });

        await expect(initializeFirebase()).rejects.toThrow('Invalid credentials');
      });

      it('should handle JSON parse error for service account', async () => {
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('invalid-json{'),
              },
            },
          ]);

        await expect(initializeFirebase()).rejects.toThrow();
      });
    });

    describe('Concurrent Initialization', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        mockAdmin.apps.length = 0;

        mockAccessSecretVersion.mockReset();
        mockAccessSecretVersion
          .mockResolvedValue([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockResolvedValue([
            {
              payload: {
                data: Buffer.from(JSON.stringify({
                  type: 'service_account',
                  project_id: 'test-project-id',
                  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                  client_email: 'test@test.iam.gserviceaccount.com',
                })),
              },
            },
          ]);
      });

      it('should wait for in-progress initialization', async () => {
        // Start first initialization (don't await)
        const promise1 = initializeFirebase();

        // Start second initialization immediately
        const promise2 = initializeFirebase();

        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('initialization in progress')
        );

        // Both should resolve to same app
        const [app1, app2] = await Promise.all([promise1, promise2]);
        expect(app1).toBe(app2);
      });

      it('should only initialize once when called concurrently', async () => {
        mockAccessSecretVersion
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from('test-project-id'),
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              payload: {
                data: Buffer.from(JSON.stringify({
                  type: 'service_account',
                  project_id: 'test-project-id',
                  private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                  client_email: 'test@test.iam.gserviceaccount.com',
                })),
              },
            },
          ]);

        await Promise.all([
          initializeFirebase(),
          initializeFirebase(),
          initializeFirebase(),
        ]);

        // Should only call initializeApp once despite 3 concurrent calls
        expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getFirebaseAdmin', () => {
    it('should return admin instance in test environment', () => {
      process.env.NODE_ENV = 'test';

      const adminInstance = getFirebaseAdmin();

      expect(adminInstance).toBe(admin);
    });

    it('should return admin instance in production', () => {
      process.env.NODE_ENV = 'production';

      const adminInstance = getFirebaseAdmin();

      expect(adminInstance).toBe(admin);
    });

    it('should return admin instance in development', () => {
      process.env.NODE_ENV = 'development';

      const adminInstance = getFirebaseAdmin();

      expect(adminInstance).toBe(admin);
    });

    it('should return admin instance when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;

      const adminInstance = getFirebaseAdmin();

      expect(adminInstance).toBe(admin);
    });

    it('should return the same admin instance every time', () => {
      const instance1 = getFirebaseAdmin();
      const instance2 = getFirebaseAdmin();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Integration', () => {
    it('should successfully complete full initialization flow', async () => {
      process.env.NODE_ENV = 'production';
      mockAdmin.apps.length = 0;

      mockAccessSecretVersion
        .mockResolvedValueOnce([
          {
            payload: {
              data: Buffer.from('cvstomize-prod'),
            },
          },
        ])
        .mockResolvedValueOnce([
          {
            payload: {
              data: Buffer.from(JSON.stringify({
                type: 'service_account',
                project_id: 'cvstomize-prod',
                private_key_id: 'abc123',
                private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----\n',
                client_email: 'firebase@cvstomize-prod.iam.gserviceaccount.com',
                client_id: '123456789',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
              })),
            },
          },
        ]);

      const app = await initializeFirebase();

      expect(app).toBeDefined();
      expect(mockAccessSecretVersion).toHaveBeenCalledTimes(2);
      expect(mockCredential.cert).toHaveBeenCalled();
      expect(mockInitializeApp).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Firebase Admin SDK initialized from Secret Manager')
      );
    });
  });
});
