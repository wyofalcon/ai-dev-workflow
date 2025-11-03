const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * POST /api/conversation
 * Create a new conversation
 * Requires valid Firebase token
 */
router.post('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

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

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        status: 'active',
      },
    });

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversation/:id
 * Get conversation by ID
 * Requires valid Firebase token
 */
router.get('/:id', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { id } = req.params;

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

    // Get conversation (ensure it belongs to the user)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation Not Found',
        message: 'Conversation not found or access denied',
      });
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversation
 * Get all conversations for current user
 * Requires valid Firebase token
 */
router.get('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

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

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
