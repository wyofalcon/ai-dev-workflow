const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * GET /api/auth/test/db
 * Test database connection (no auth required)
 */
router.get('/test/db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Database query successful:', result);
    res.json({
      status: 'connected',
      message: 'Database connection successful',
      result,
      prismaVersion: require('@prisma/client').Prisma.prismaVersion,
    });
  } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    res.status(500).json({
      status: 'failed',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
    });
  }
});

/**
 * GET /api/auth/test/token
 * Test Firebase token verification (no database)
 */
router.get('/test/token', verifyFirebaseToken, (req, res) => {
  console.log('✅ Token verified successfully, user:', req.user);
  res.json({
    status: 'success',
    message: 'Firebase token verified successfully',
    user: req.user,
  });
});

/**
 * POST /api/auth/register
 * Create user record in database after Firebase signup
 * Requires valid Firebase token
 */
router.post('/register', verifyFirebaseToken, async (req, res, next) => {
  try {
    console.log('📝 /api/auth/register - Starting registration');
    console.log('👤 User from token:', JSON.stringify(req.user, null, 2));

    const { firebaseUid, email, emailVerified, displayName, photoUrl, authProvider } = req.user;

    // Check if user already exists
    console.log('🔍 Checking for existing user:', firebaseUid);
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    console.log('✅ Database query successful, existing user:', !!existingUser);

    if (existingUser) {
      console.log('👤 User already exists, returning existing record');
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
    console.log('➕ Creating new user in database');
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
    console.log('✅ User created successfully, ID:', newUser.id);

    // TODO: Re-enable audit logging once audit_logs table is created
    // Log audit event
    // console.log('📋 Creating audit log entry');
    // await prisma.auditLog.create({
    //   data: {
    //     userId: newUser.id,
    //     action: 'user_registered',
    //     resource: 'user',
    //     resourceId: newUser.id,
    //     details: {
    //       authProvider,
    //       email,
    //     },
    //   },
    // });
    // console.log('✅ Audit log created');

    console.log('🎉 Registration complete, sending response');
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
    console.error('❌ ERROR in /api/auth/register:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      prismaCode: error.code,
      meta: error.meta,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
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

    // TODO: Re-enable audit logging once audit_logs table is created
    // Log audit event
    // await prisma.auditLog.create({
    //   data: {
    //     userId: user.id,
    //     action: 'user_login',
    //     resource: 'user',
    //     resourceId: user.id,
    //   },
    // });

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
      // TODO: Re-enable audit logging once audit_logs table is created
      // Log audit event
      // await prisma.auditLog.create({
      //   data: {
      //     userId: user.id,
      //     action: 'user_logout',
      //     resource: 'user',
      //     resourceId: user.id,
      //   },
      // });
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
    console.log('📋 /api/auth/me - Fetching user profile');
    console.log('👤 Firebase UID:', req.user.firebaseUid);

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

    console.log('✅ Query completed, user found:', !!user);

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found in database',
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('❌ ERROR in /api/auth/me:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    next(error);
  }
});

module.exports = router;
