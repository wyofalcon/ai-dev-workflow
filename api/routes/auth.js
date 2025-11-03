const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Create user record in database after Firebase signup
 * Requires valid Firebase token
 */
router.post('/register', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid, email, emailVerified, displayName, photoUrl, authProvider } = req.user;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (existingUser) {
      return res.status(200).json({
        message: 'User already registered',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          displayName: existingUser.displayName,
          subscriptionTier: existingUser.subscriptionTier,
          resumesGenerated: existingUser.resumesGenerated,
          resumesLimit: existingUser.resumesLimit,
        },
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        emailVerified,
        displayName,
        photoUrl,
        authProvider,
        subscriptionTier: 'free',
        resumesGenerated: 0,
        resumesLimit: 1, // Free tier gets 1 resume
        lastLoginAt: new Date(),
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'user_registered',
        resource: 'user',
        resourceId: newUser.id,
        details: {
          authProvider,
          email,
        },
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        subscriptionTier: newUser.subscriptionTier,
        resumesGenerated: newUser.resumesGenerated,
        resumesLimit: newUser.resumesLimit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Update last login timestamp and return user data
 * Requires valid Firebase token
 */
router.post('/login', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    // Find user and update last login
    const user = await prisma.user.update({
      where: { firebaseUid },
      data: { lastLoginAt: new Date() },
      include: {
        profile: true,
        personalityTraits: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found. Please register first.',
      });
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        resource: 'user',
        resourceId: user.id,
      },
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        subscriptionTier: user.subscriptionTier,
        resumesGenerated: user.resumesGenerated,
        resumesLimit: user.resumesLimit,
        hasProfile: !!user.profile,
        hasPersonalityTraits: !!user.personalityTraits,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/verify
 * Verify token and return user info
 * Requires valid Firebase token
 */
router.get('/verify', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: {
        id: true,
        email: true,
        displayName: true,
        photoUrl: true,
        subscriptionTier: true,
        resumesGenerated: true,
        resumesLimit: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found in database',
      });
    }

    res.status(200).json({
      valid: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Log user logout (optional endpoint for tracking)
 * Requires valid Firebase token
 */
router.post('/logout', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });

    if (user) {
      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'user_logout',
          resource: 'user',
          resourceId: user.id,
        },
      });
    }

    res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user's complete profile
 * Requires valid Firebase token
 */
router.get('/me', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        profile: true,
        personalityTraits: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            jobTitle: true,
            createdAt: true,
            pdfUrl: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found in database',
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        subscriptionTier: user.subscriptionTier,
        resumesGenerated: user.resumesGenerated,
        resumesLimit: user.resumesLimit,
        emailVerified: user.emailVerified,
        profile: user.profile,
        personalityTraits: user.personalityTraits,
        recentResumes: user.resumes,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
