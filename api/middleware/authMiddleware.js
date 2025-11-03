const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK with service account from Secret Manager
 */
async function initializeFirebaseAdmin() {
  if (firebaseInitialized) {
    return;
  }

  try {
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GCP_PROJECT_ID || 'cvstomize';

    // Get service account key from Secret Manager
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/cvstomize-service-account-key/versions/latest`,
    });

    const serviceAccount = JSON.parse(version.payload.data.toString());

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Middleware to verify Firebase ID token
 * Extracts user information and attaches to req.user
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
      await initializeFirebaseAdmin();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

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
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  requireSubscription,
  checkResumeLimit,
};
