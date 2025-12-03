const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { parseResume, extractTextFromFile } = require('../services/resumeParser');

const prisma = new PrismaClient();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a PDF, DOCX, or TXT file.'));
    }
  },
});

/**
 * POST /api/profile/parse-resume
 * Upload and parse a resume file to extract profile data
 * Requires valid Firebase token
 */
router.post('/parse-resume', verifyFirebaseToken, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File Uploaded',
        message: 'Please upload a resume file (PDF, DOCX, or TXT)',
      });
    }

    console.log('📄 Parsing resume file:', req.file.originalname, req.file.mimetype);

    // Extract text from file
    const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: 'Invalid Resume',
        message: 'Could not extract text from the uploaded file. Please try a different format.',
      });
    }

    // Parse resume using AI
    const result = await parseResume(resumeText);

    res.status(200).json({
      message: 'Resume parsed successfully',
      extractedData: result.data,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    next(error);
  }
});

/**
 * POST /api/profile/parse-resume-text
 * Parse pasted resume text to extract profile data
 * Requires valid Firebase token
 */
router.post('/parse-resume-text', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: 'Invalid Input',
        message: 'Please provide resume text with at least 50 characters',
      });
    }

    console.log('📄 Parsing pasted resume text, length:', resumeText.length);

    // Parse resume using AI
    const result = await parseResume(resumeText);

    res.status(200).json({
      message: 'Resume parsed successfully',
      extractedData: result.data,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    next(error);
  }
});

/**
 * POST /api/profile
 * Create or update user profile
 * Requires valid Firebase token
 */
router.post('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { completeOnboarding, ...profileData } = req.body;

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

    // If completeOnboarding flag is set, mark onboarding as completed
    if (completeOnboarding) {
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile,
      onboardingCompleted: completeOnboarding || false,
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
