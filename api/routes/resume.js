const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { verifyFirebaseToken, checkResumeLimit } = require('../middleware/authMiddleware');
const geminiServiceVertex = require('../services/geminiServiceVertex');
const { inferPersonality } = require('../services/personalityInference');

// Helper: Build personality-enhanced Gemini prompt
function buildResumePrompt({ resumeText, personalStories, jobDescription, selectedSections, personality }) {
  let personalityGuidance = '';

  if (personality) {
    personalityGuidance = `
PERSONALITY-BASED FRAMING:
- Openness: ${personality.openness}/100 ${personality.openness > 70 ? '(Emphasize innovation)' : '(Focus on reliability)'}
- Conscientiousness: ${personality.conscientiousness}/100 ${personality.conscientiousness > 70 ? '(Highlight attention to detail)' : '(Emphasize adaptability)'}
- Extraversion: ${personality.extraversion}/100 ${personality.extraversion > 70 ? '(Showcase teamwork)' : '(Highlight independent work)'}
- Work Style: ${personality.workStyle || 'balanced'}
- Communication: ${personality.communicationStyle || 'professional'}

Frame achievements through this personality lens.
`;
  }

  return `You are an expert resume writer. Generate a professional, ATS-optimized resume tailored to the job description.

${personalityGuidance}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S EXPERIENCE:
${resumeText || ''}

PERSONAL STORIES:
${personalStories || 'Not provided'}

SECTIONS TO INCLUDE:
${Array.isArray(selectedSections) ? selectedSections.join(', ') : selectedSections}

OUTPUT:
- Valid markdown format
- Match job keywords
- Quantify achievements
- Concise bullet points (1-2 lines)
- ATS-friendly (no tables)

Generate the resume:`;
}

/**
 * POST /api/resume/generate
 * Generate a new resume with Gemini + personality insights
 * Replaces the old Vercel function with full tracking
 */
router.post('/generate', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;

    // Check resume limit
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true, resumesGenerated: true, resumesLimit: true, subscriptionTier: true }
    });

    if (userRecord.resumesGenerated >= userRecord.resumesLimit) {
      return res.status(403).json({
        error: 'Resume limit reached',
        message: `You've used ${userRecord.resumesGenerated}/${userRecord.resumesLimit} resumes. Upgrade for unlimited.`,
        upgradeUrl: '/pricing'
      });
    }

    // Extract input
    const { resumeText, personalStories, jobDescription, selectedSections, targetCompany } = req.body;

    if (!jobDescription || !selectedSections || selectedSections.length === 0) {
      return res.status(400).json({ error: 'Job description and sections required' });
    }

    const startTime = Date.now();

    // Load or infer personality
    let personality = await prisma.personalityTraits.findUnique({ where: { userId: userRecord.id } });

    if (!personality && personalStories) {
      console.log('Inferring personality from stories...');
      const inferredTraits = inferPersonality([{ messageRole: 'user', messageContent: personalStories }]);
      personality = await prisma.personalityTraits.create({
        data: { userId: userRecord.id, ...inferredTraits }
      });
    }

    // Build prompt
    const prompt = buildResumePrompt({
      resumeText, personalStories, jobDescription,
      selectedSections: Array.isArray(selectedSections) ? selectedSections : selectedSections.split(','),
      personality
    });

    // Generate with Gemini Pro
    console.log('Generating resume with Gemini 1.5 Pro...');
    const model = geminiServiceVertex.getProModel();
    const result = await model.generateContent(prompt);
    const response = result.response;

    const resumeMarkdown = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!resumeMarkdown) throw new Error('No content generated');

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    const generationTime = Date.now() - startTime;

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId: userRecord.id,
        title: targetCompany ? `Resume for ${targetCompany}` : 'Tailored Resume',
        targetCompany: targetCompany || null,
        jobDescription,
        resumeMarkdown,
        modelUsed: 'gemini-1.5-pro',
        tokensUsed,
        generationTimeMs: generationTime,
        costUsd: (tokensUsed / 1000000) * 1.25, // $1.25 per 1M tokens
        status: 'generated'
      }
    });

    // Increment counter
    await prisma.user.update({
      where: { id: userRecord.id },
      data: { resumesGenerated: { increment: 1 }, updatedAt: new Date() }
    });

    console.log('Resume saved:', resume.id);

    return res.status(201).json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        markdown: resumeMarkdown,
        createdAt: resume.createdAt
      },
      usage: {
        resumesGenerated: userRecord.resumesGenerated + 1,
        resumesLimit: userRecord.resumesLimit,
        remaining: Math.max(0, userRecord.resumesLimit - userRecord.resumesGenerated - 1)
      },
      metadata: { tokensUsed, generationTimeMs: generationTime, personalityUsed: !!personality }
    });

  } catch (error) {
    console.error('Resume generation error:', error);
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
 * GET /api/resume/list
 * Get all resumes for current user
 */
router.get('/list', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        targetCompany: true,
        status: true,
        createdAt: true,
        downloadedAt: true,
        tokensUsed: true
      },
    });

    return res.json({ resumes, total: resumes.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/resume/:id/download
 * Download resume markdown for PDF conversion
 */
router.get('/:id/download', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const resume = await prisma.resume.findFirst({
      where: { id, userId: user.id }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Mark as downloaded
    await prisma.resume.update({
      where: { id },
      data: { downloadedAt: new Date() }
    });

    return res.json({
      markdown: resume.resumeMarkdown,
      title: resume.title
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
