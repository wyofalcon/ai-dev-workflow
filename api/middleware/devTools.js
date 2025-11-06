/**
 * Development Tools Middleware
 * SECURITY: Only active in development/test environments
 *
 * Provides safe ways to bypass restrictions during development
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Dev-only middleware to check if admin mode is enabled
 *
 * Usage:
 *   Set DEV_ADMIN_MODE=true in .env to enable admin features
 *   This allows testing unlimited resume generation, admin endpoints, etc.
 */
function requireDevAdmin(req, res, next) {
  // Only allow in development or test
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint is not available in production',
    });
  }

  // Check if dev admin mode is enabled
  if (process.env.DEV_ADMIN_MODE !== 'true') {
    return res.status(403).json({
      error: 'Dev Admin Mode Disabled',
      message: 'Set DEV_ADMIN_MODE=true in .env to enable this endpoint',
      hint: 'This is a development-only feature for testing',
    });
  }

  logger.warn('⚠️ DEV ADMIN MODE: Bypassing authorization checks', {
    endpoint: req.path,
    user: req.user?.email,
  });

  next();
}

/**
 * Dev-only middleware to bypass resume limits
 *
 * Automatically sets unlimited resumes for the current user
 * Only works in dev/test environments
 */
async function bypassResumeLimit(req, res, next) {
  // Only allow in development or test
  if (process.env.NODE_ENV === 'production') {
    return next(); // In production, use normal resume limit check
  }

  // Check if dev unlimited mode is enabled
  if (process.env.DEV_UNLIMITED_RESUMES !== 'true') {
    return next(); // Use normal resume limit check
  }

  try {
    // Automatically upgrade user to unlimited in dev
    const { firebaseUid } = req.user;

    await prisma.user.updateMany({
      where: { firebaseUid },
      data: {
        resumesLimit: 999999,
        subscriptionTier: 'dev-unlimited',
      },
    });

    logger.info('🔓 DEV MODE: Bypassed resume limit for user', {
      user: req.user?.email,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    logger.error('Failed to bypass resume limit in dev mode', error);
    next(error);
  }
}

/**
 * Dev-only endpoint to reset user's resume count
 * Useful for testing the resume generation flow multiple times
 */
async function resetResumeCount(req, res, next) {
  try {
    const { firebaseUid } = req.user;

    const updated = await prisma.user.update({
      where: { firebaseUid },
      data: {
        resumesGenerated: 0,
        resumesLimit: 999999,
        subscriptionTier: 'dev-unlimited',
      },
      select: {
        email: true,
        resumesGenerated: true,
        resumesLimit: true,
        subscriptionTier: true,
      },
    });

    logger.info('🔄 DEV MODE: Reset resume count', {
      user: updated.email,
    });

    res.json({
      message: 'Resume count reset successfully (dev mode only)',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check if running in development mode
 */
function isDevelopment() {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Check if dev admin mode is enabled
 */
function isDevAdminEnabled() {
  return isDevelopment() && process.env.DEV_ADMIN_MODE === 'true';
}

/**
 * Check if dev unlimited resumes is enabled
 */
function isDevUnlimitedEnabled() {
  return isDevelopment() && process.env.DEV_UNLIMITED_RESUMES === 'true';
}

module.exports = {
  requireDevAdmin,
  bypassResumeLimit,
  resetResumeCount,
  isDevelopment,
  isDevAdminEnabled,
  isDevUnlimitedEnabled,
};
