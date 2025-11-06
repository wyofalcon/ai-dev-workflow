const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { verifyFirebaseToken, checkResumeLimit } = require('../middleware/authMiddleware');
const geminiServiceVertex = require('../services/geminiServiceVertex');
const { inferPersonality } = require('../services/personalityInference');
const JobDescriptionAnalyzer = require('../services/jobDescriptionAnalyzer');
const { buildFullConversation, validateAnswer } = require('../services/personalityQuestions');
const atsOptimizer = require('../services/atsOptimizer');
const pdfGenerator = require('../services/pdfGenerator');

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

  const hasContent = (resumeText && resumeText.length > 20) || (personalStories && personalStories.length > 20);

  return `You are an elite-level professional resume writer and career strategist with 15+ years of experience.

${personalityGuidance}

**TARGET JOB DESCRIPTION:**
${jobDescription}

**CANDIDATE'S BACKGROUND:**
${resumeText || 'No formal resume provided - extract experience from personal stories below'}

**PERSONAL ACHIEVEMENTS & STORIES:**
${personalStories || 'Limited information - create professional examples based on job requirements'}

**REQUIRED SECTIONS:**
${Array.isArray(selectedSections) ? selectedSections.join(', ') : selectedSections}

**INSTRUCTIONS:**
${hasContent
  ? '1. Extract concrete experience, skills, and achievements from the candidate\'s background and stories'
  : '1. Since minimal candidate data provided, create a professional resume framework with placeholder content marked with [EDIT: ...]'
}
2. Tailor EVERY bullet point to match keywords and requirements from the job description
3. Use strong action verbs (Led, Achieved, Implemented, Optimized, Delivered)
4. Quantify ALL achievements with specific numbers, percentages, or metrics
5. Keep bullet points concise (1-2 lines maximum)
6. Format in clean Markdown with clear headers (###)
7. Include a compelling Professional Summary paragraph at the top
8. Ensure ATS-friendly format (no tables, complex formatting, or images)
9. Use the exact job title from the job description as the target role
10. Include contact information: [Your Name], [City, State], [Phone], [Email], [LinkedIn]

**OUTPUT FORMAT:**
# [Your Name]
[City, State] | [Phone] | [Email] | [LinkedIn]

---

## Professional Summary
[2-3 sentence paragraph highlighting key qualifications and alignment with job]

---

## Core Competencies
[8-12 relevant skills in bullet format]

---

## Professional Experience

**[Job Title]** | [Company Name] | [Location] | [Dates]
- [Achievement with quantifiable result]
- [Achievement with quantifiable result]
- [Achievement with quantifiable result]

[Repeat for 2-3 positions]

---

## Education
**[Degree]** | [School Name] | [Graduation Year]

---

Generate a compelling, professional resume now:`;
}

/**
 * POST /api/resume/generate
 * Generate a new resume with Gemini + personality insights
 * Replaces the old Vercel function with full tracking
 */
const { bypassResumeLimit, isDevUnlimitedEnabled } = require('../middleware/devTools');

router.post('/generate',
  verifyFirebaseToken,
  // In dev with DEV_UNLIMITED_RESUMES=true, automatically upgrade user to unlimited
  isDevUnlimitedEnabled() ? bypassResumeLimit : (req, res, next) => next(),
  async (req, res, next) => {
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
    let personality = await prisma.personalityTraits.findUnique({
      where: { userId: userRecord.id },
      select: {
        id: true,
        openness: true,
        conscientiousness: true,
        extraversion: true,
        agreeableness: true,
        neuroticism: true,
        workStyle: true,
        communicationStyle: true
      }
    });

    if (!personality && personalStories) {
      console.log('Inferring personality from stories...');
      const inferredTraits = inferPersonality([{ messageRole: 'user', messageContent: personalStories }]);

      // Only include fields that exist in database schema
      const { openness, conscientiousness, extraversion, agreeableness, neuroticism, workStyle, communicationStyle } = inferredTraits;

      personality = await prisma.personalityTraits.create({
        data: {
          userId: userRecord.id,
          openness,
          conscientiousness,
          extraversion,
          agreeableness,
          neuroticism,
          workStyle,
          communicationStyle
        }
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

    // ATS Optimization: Extract keywords and calculate coverage
    console.log('Analyzing ATS keyword coverage...');
    const jobKeywords = atsOptimizer.extractKeywords(jobDescription);
    const atsAnalysis = atsOptimizer.calculateCoverage(jobKeywords, resumeMarkdown);
    const atsFormatting = atsOptimizer.validateATSFormatting(resumeMarkdown);
    const optimizations = atsOptimizer.suggestOptimizations(jobKeywords, atsAnalysis);

    console.log('ATS Analysis:', {
      coverage: `${atsAnalysis.coveragePercentage}%`,
      mustHaveCoverage: `${atsAnalysis.mustHaveCoverage}%`,
      atsScore: atsFormatting.score,
      isATSFriendly: atsFormatting.isATSFriendly
    });

    // Save to database
    const resume = await prisma.resume.create({
      data: {
        userId: userRecord.id,
        title: targetCompany ? `Resume for ${targetCompany}` : 'Tailored Resume',
        targetCompany: targetCompany || null,
        jobDescription,
        resumeMarkdown,
        modelUsed: 'gemini-2.5-pro',
        tokensUsed,
        generationTimeMs: generationTime,
        costUsd: (tokensUsed / 1000000) * 1.25,
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
      atsAnalysis: {
        coverage: atsAnalysis.coveragePercentage,
        mustHaveCoverage: atsAnalysis.mustHaveCoverage,
        score: atsFormatting.score,
        isATSFriendly: atsFormatting.isATSFriendly,
        matchedKeywords: atsAnalysis.matchedKeywords.length,
        missingKeywords: atsAnalysis.missingKeywords.length,
        optimizations: optimizations.filter(o => o.priority === 'HIGH' || o.priority === 'CRITICAL')
      },
      usage: {
        resumesGenerated: userRecord.resumesGenerated + 1,
        resumesLimit: userRecord.resumesLimit,
        remaining: Math.max(0, userRecord.resumesLimit - userRecord.resumesGenerated - 1)
      },
      metadata: {
        tokensUsed,
        generationTimeMs: generationTime,
        personalityUsed: !!personality,
        atsOptimized: true
      }
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    next(error);
  }
});

/**
 * POST /api/resume/analyze-jd
 * Analyze job description and generate targeted questions
 */
router.post('/analyze-jd', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Validate job description
    const analyzer = new JobDescriptionAnalyzer(geminiServiceVertex);
    const validation = analyzer.validateJobDescription(jobDescription);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    console.log('Analyzing job description...');

    // Perform analysis
    const analysis = await analyzer.analyze(jobDescription);

    console.log('✅ JD analysis complete:', {
      jobTitle: analysis.analysis.jobTitle,
      experienceLevel: analysis.analysis.experienceLevel,
      technicalSkills: analysis.analysis.requiredSkills.technical.length,
      questionsGenerated: analysis.questions.length
    });

    res.json({
      success: true,
      analysis: analysis.analysis,
      questions: analysis.questions,
      metadata: {
        analyzedAt: analysis.analyzedAt,
        questionCount: analysis.questions.length
      }
    });

  } catch (error) {
    console.error('JD analysis error:', error);
    next(error);
  }
});

/**
 * POST /api/resume/conversation-flow
 * Get full conversation flow (11 questions) after JD analysis
 */
router.post('/conversation-flow', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { jdAnalysis } = req.body;

    if (!jdAnalysis || !jdAnalysis.questions) {
      return res.status(400).json({
        error: 'JD analysis required. Call /api/resume/analyze-jd first.'
      });
    }

    // Build full 13-step conversation
    const conversationFlow = buildFullConversation(jdAnalysis.questions);

    res.json({
      success: true,
      totalSteps: conversationFlow.length,
      steps: conversationFlow,
      metadata: {
        jdQuestions: 5,
        personalityQuestions: 6,
        processingSteps: 1,
        estimatedTimeMinutes: 10
      }
    });

  } catch (error) {
    console.error('Conversation flow error:', error);
    next(error);
  }
});

/**
 * POST /api/resume/validate-answer
 * Validate a single conversation answer
 */
router.post('/validate-answer', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({ error: 'questionId and answer are required' });
    }

    const validation = validateAnswer(questionId, answer);

    res.json({
      success: true,
      valid: validation.valid,
      error: validation.error || null
    });

  } catch (error) {
    console.error('Answer validation error:', error);
    next(error);
  }
});

/**
 * GET /api/resume/list
 * Get all resumes for current user
 * IMPORTANT: Must be BEFORE /:id route to avoid matching "list" as an id
 */
router.get('/list', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;

    // Look up user to get their database ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: userRecord.id },
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
 * GET /api/resume/:id/ats-analysis
 * Get detailed ATS analysis for a resume
 */
router.get('/:id/ats-analysis', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Get user ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    const resume = await prisma.resume.findFirst({
      where: { id, userId: userRecord.id },
      select: {
        resumeMarkdown: true,
        jobDescription: true,
        title: true
      }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Perform ATS analysis
    const jobKeywords = atsOptimizer.extractKeywords(resume.jobDescription);
    const coverage = atsOptimizer.calculateCoverage(jobKeywords, resume.resumeMarkdown);
    const formatting = atsOptimizer.validateATSFormatting(resume.resumeMarkdown);
    const optimizations = atsOptimizer.suggestOptimizations(jobKeywords, coverage);

    return res.json({
      success: true,
      resumeTitle: resume.title,
      analysis: {
        keywords: {
          total: jobKeywords.allKeywords.length,
          skills: jobKeywords.skills.length,
          responsibilities: jobKeywords.responsibilities.length,
          qualifications: jobKeywords.qualifications.length,
          mustHave: jobKeywords.mustHave.length,
          niceToHave: jobKeywords.niceToHave.length
        },
        coverage: {
          overall: coverage.coveragePercentage,
          mustHave: coverage.mustHaveCoverage,
          matched: coverage.matchedKeywords.length,
          missing: coverage.missingKeywords.length,
          matchedKeywords: coverage.matchedKeywords.slice(0, 20), // Top 20
          missingKeywords: coverage.missingKeywords.slice(0, 10), // Top 10 missing
          suggestions: coverage.suggestions.slice(0, 5) // Top 5 suggestions
        },
        formatting: {
          isATSFriendly: formatting.isATSFriendly,
          score: formatting.score,
          issues: formatting.issues,
          warnings: formatting.warnings
        },
        optimizations: optimizations,
        grade: this._calculateATSGrade(coverage.coveragePercentage, coverage.mustHaveCoverage, formatting.score)
      }
    });

  } catch (error) {
    console.error('ATS analysis error:', error);
    next(error);
  }
});

// Helper: Calculate ATS grade
function _calculateATSGrade(coverage, mustHaveCoverage, formattingScore) {
  const avgScore = (coverage + mustHaveCoverage + formattingScore) / 3;

  if (avgScore >= 90) return { grade: 'A+', color: 'success', message: 'Excellent ATS optimization' };
  if (avgScore >= 85) return { grade: 'A', color: 'success', message: 'Very strong ATS compatibility' };
  if (avgScore >= 80) return { grade: 'B+', color: 'info', message: 'Good ATS compatibility' };
  if (avgScore >= 75) return { grade: 'B', color: 'info', message: 'Acceptable ATS compatibility' };
  if (avgScore >= 70) return { grade: 'C+', color: 'warning', message: 'Needs improvement' };
  if (avgScore >= 65) return { grade: 'C', color: 'warning', message: 'Significant improvements needed' };
  return { grade: 'D', color: 'error', message: 'Poor ATS compatibility - major revisions required' };
}

/**
 * GET /api/resume/:id/pdf
 * Generate and download resume as PDF
 * Query params: template (classic|modern|minimal)
 */
router.get('/:id/pdf', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { template = 'classic' } = req.query;

    // Validate template
    if (!pdfGenerator.isValidTemplate(template)) {
      return res.status(400).json({
        error: 'Invalid template',
        message: `Template must be one of: ${pdfGenerator.getAvailableTemplates().map(t => t.name).join(', ')}`
      });
    }

    // Get user ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    const resume = await prisma.resume.findFirst({
      where: { id, userId: userRecord.id },
      select: {
        resumeMarkdown: true,
        title: true,
        targetCompany: true
      }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    console.log(`Generating PDF for resume ${id} with template: ${template}`);

    // Generate PDF
    const startTime = Date.now();
    const pdfBuffer = await pdfGenerator.generatePDF(resume.resumeMarkdown, template);
    const generationTime = Date.now() - startTime;

    console.log(`PDF generated in ${generationTime}ms, size: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);

    // Mark as downloaded
    await prisma.resume.update({
      where: { id },
      data: {
        downloadedAt: new Date(),
        pdfTemplate: template
      }
    });

    // Generate filename
    const filename = resume.targetCompany
      ? `Resume-${resume.targetCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : `Resume-${new Date().toISOString().split('T')[0]}.pdf`;

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Generation-Time-Ms', generationTime);

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    next(error);
  }
});

/**
 * GET /api/resume/templates/list
 * Get available PDF templates with descriptions
 */
router.get('/templates/list', verifyFirebaseToken, (req, res) => {
  const templates = pdfGenerator.getAvailableTemplates();
  res.json({
    success: true,
    templates,
    count: templates.length
  });
});

/**
 * GET /api/resume/:id/download
 * Download resume markdown (legacy endpoint for backwards compatibility)
 */
router.get('/:id/download', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Get user ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    const resume = await prisma.resume.findFirst({
      where: { id, userId: userRecord.id }
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
