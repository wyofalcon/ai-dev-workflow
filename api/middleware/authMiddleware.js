const { getFirebaseAdmin } = require('../config/firebase');
const prisma = require('../config/database');

/**
 * Middleware to verify Firebase ID token
 * Extracts user information and attaches to req.user
 *
 * PRODUCTION NOTE: Firebase must be initialized at server startup,
 * not per-request. See api/index.js for initialization.
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    // Get Firebase Admin instance (already initialized at startup)
    const admin = getFirebaseAdmin();

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
 * Uses singleton Prisma instance to prevent connection leaks
 */
function requireSubscription(...allowedTiers) {
  return async (req, res, next) => {
    try {
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
 * Uses singleton Prisma instance to prevent connection leaks
 */
async function checkResumeLimit(req, res, next) {
  try {
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
