const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * POST /api/profile
 * Create or update user profile
 * Requires valid Firebase token
 */
router.post('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const profileData = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found',
      });
    }

    // Upsert profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile
 * Get user profile
 * Requires valid Firebase token
 */
router.get('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found',
      });
    }

    res.status(200).json({
      profile: user.profile,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
