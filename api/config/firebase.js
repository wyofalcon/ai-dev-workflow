const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Promise-based lock to prevent concurrent initialization
let firebaseInitPromise = null;
let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK from Google Secret Manager
 * Production-grade initialization with proper error handling
 */
async function initializeFromSecretManager() {
  try {
    const client = new SecretManagerServiceClient();

    // Get project ID from Secret Manager first
    const [projectIdResponse] = await client.accessSecretVersion({
      name: 'projects/351889420459/secrets/cvstomize-project-id/versions/latest',
    });
    const projectId = projectIdResponse.payload.data.toString('utf8').trim();

    // Get service account key from Secret Manager
    const [serviceAccountResponse] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/cvstomize-service-account-key/versions/latest`,
    });
    const serviceAccountKey = JSON.parse(
      serviceAccountResponse.payload.data.toString('utf8')
    );

    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: projectId,
    });

    console.log('✅ Firebase Admin SDK initialized from Secret Manager');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase from Secret Manager:', error);
    throw error;
  }
}

/**
 * Initialize Firebase Admin SDK with environment detection
 * Supports test, development, and production environments
 */
async function initializeFirebase() {
  // If already initialized, return existing app
  if (admin.apps.length > 0) {
    console.log('🔥 Firebase app already exists, reusing...');
    return admin.app();
  }

  // If initialization in progress, wait for it
  if (firebaseInitPromise) {
    console.log('⏳ Firebase initialization in progress, waiting...');
    return firebaseInitPromise;
  }

  // Test environment - return mock (handled by jest.mock)
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Test environment detected - using mocked Firebase');
    // The mock is set up in tests/setup.js
    return admin.app();
  }

  // Production/Development - initialize from Secret Manager
  console.log('🚀 Initializing Firebase Admin SDK...');
  firebaseInitPromise = initializeFromSecretManager()
    .then(app => {
      firebaseApp = app;
      return app;
    })
    .catch(error => {
      firebaseInitPromise = null; // Reset on error to allow retry
      throw error;
    });

  return firebaseInitPromise;
}

/**
 * Get Firebase Admin instance (for testing/mocking)
 * This allows tests to inject their own Firebase mock
 */
function getFirebaseAdmin() {
  if (process.env.NODE_ENV === 'test') {
    return admin;
  }
  return admin;
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
};
