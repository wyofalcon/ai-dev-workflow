const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken, checkResumeLimit } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

/**
 * POST /api/resume
 * Generate a new resume
 * Requires valid Firebase token and checks resume limit
 */
router.post('/', verifyFirebaseToken, checkResumeLimit, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { jobTitle, jobDescription, conversationId } = req.body;

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

    // TODO: Implement resume generation with Gemini API
    // For now, create a placeholder resume record

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        conversationId,
        jobTitle,
        jobDescription,
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Resume generation started',
      resume: {
        id: resume.id,
        jobTitle: resume.jobTitle,
        status: resume.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/:id
 * Get resume by ID
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

    // Get resume (ensure it belongs to the user)
    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume Not Found',
        message: 'Resume not found or access denied',
      });
    }

    res.status(200).json({
      resume,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume
 * Get all resumes for current user
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

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        jobTitle: true,
        status: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      resumes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
