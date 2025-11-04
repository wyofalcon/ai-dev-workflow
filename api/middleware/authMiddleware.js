const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Promise-based lock to prevent concurrent initialization
let firebaseInitPromise = null;

/**
 * Get or initialize Firebase Admin SDK with race condition protection
 * Uses promise caching to prevent concurrent initialization attempts
 */
async function getFirebaseAdmin() {
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

  // Start initialization and cache the promise
  console.log('🚀 Initializing Firebase Admin SDK...');
  firebaseInitPromise = (async () => {
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

      console.log('✅ Firebase Admin SDK initialized successfully');
      return app;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      firebaseInitPromise = null; // Reset on error to allow retry
      throw error;
    }
  })();

  return firebaseInitPromise;
}

/**
 * Middleware to verify Firebase ID token
 * Extracts user information and attaches to req.user
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    // Ensure Firebase is initialized (will reuse if already exists)
    const app = await getFirebaseAdmin();

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the token with Firebase - USE APP INSTANCE NOT GLOBAL
    const decodedToken = await app.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoUrl: decodedToken.picture,
      authProvider: decodedToken.firebase.sign_in_provider,
    };

    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Your authentication token has expired. Please sign in again.',
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'The authentication token is invalid or malformed.',
      });
    }

    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Failed to authenticate request',
    });
  }
}

/**
 * Middleware to check if user has a specific subscription tier
 */
function requireSubscription(...allowedTiers) {
  return async (req, res, next) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { firebaseUid: req.user.firebaseUid },
        select: { subscriptionTier: true },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User account not found in database',
        });
      }

      if (!allowedTiers.includes(user.subscriptionTier)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This feature requires a ${allowedTiers.join(' or ')} subscription`,
          currentTier: user.subscriptionTier,
        });
      }

      req.user.subscriptionTier = user.subscriptionTier;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has reached their resume generation limit
 */
async function checkResumeLimit(req, res, next) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.firebaseUid },
      select: {
        subscriptionTier: true,
        resumesGenerated: true,
        resumesLimit: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found in database',
      });
    }

    // Check if user has reached their limit
    if (user.resumesGenerated >= user.resumesLimit) {
      return res.status(403).json({
        error: 'Limit Reached',
        message: 'You have reached your resume generation limit',
        currentCount: user.resumesGenerated,
        limit: user.resumesLimit,
        subscriptionTier: user.subscriptionTier,
      });
    }

    req.user.resumesGenerated = user.resumesGenerated;
    req.user.resumesLimit = user.resumesLimit;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFirebaseAdmin,
  verifyFirebaseToken,
  requireSubscription,
  checkResumeLimit,
};
