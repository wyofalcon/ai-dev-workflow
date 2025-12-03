const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fs = require('fs');
const path = require('path');

// Promise-based lock to prevent concurrent initialization
let firebaseInitPromise = null;
let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK from local service account file
 * Used for local development
 */
async function initializeFromLocalFile() {
  try {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './gcp-key.json';
    const absolutePath = path.resolve(__dirname, '..', keyPath);
    
    console.log(`📁 Loading Firebase credentials from: ${absolutePath}`);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Service account key file not found: ${absolutePath}`);
    }

    const serviceAccountKey = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    
    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });

    console.log(`✅ Firebase Admin SDK initialized from local file (project: ${serviceAccountKey.project_id})`);
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase from local file:', error);
    throw error;
  }
}

/**
 * Initialize Firebase Admin SDK from Google Secret Manager
 * Production-grade initialization with proper error handling
 */
async function initializeFromSecretManager() {
  try {
    const client = new SecretManagerServiceClient();

    // Detect current GCP project (staging vs production)
    // Use K_SERVICE to determine environment, or default to production
    const isStaging = process.env.NODE_ENV === 'staging';
    const currentGcpProject = isStaging ? 'cvstomize-staging' : 'cvstomize';

    // Get project ID from Secret Manager first
    const [projectIdResponse] = await client.accessSecretVersion({
      name: `projects/${currentGcpProject}/secrets/cvstomize-project-id/versions/latest`,
    });
    const projectId = projectIdResponse.payload.data.toString('utf8').trim();

    // Get service account key from Secret Manager (stored in the same GCP project as DATABASE_URL)
    const [serviceAccountResponse] = await client.accessSecretVersion({
      name: `projects/${currentGcpProject}/secrets/cvstomize-service-account-key/versions/latest`,
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

  // Development - use local service account file
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development environment - using local credentials');
    firebaseInitPromise = initializeFromLocalFile()
      .then(app => {
        firebaseApp = app;
        return app;
      })
      .catch(error => {
        firebaseInitPromise = null;
        throw error;
      });
    return firebaseInitPromise;
  }

  // Production/Staging - initialize from Secret Manager
  console.log('🚀 Initializing Firebase Admin SDK from Secret Manager...');
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
