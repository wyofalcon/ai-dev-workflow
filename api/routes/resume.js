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
const cloudStorageService = require('../services/cloudStorage');

// Helper: Build personality-enhanced Gemini prompt
function buildResumePrompt({ resumeText, personalStories, jobDescription, selectedSections, personality, gapAnalysis, existingResume }) {
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

  // NEW: Gap analysis guidance for resume-first mode
  let gapAnalysisGuidance = '';
  if (gapAnalysis && existingResume) {
    gapAnalysisGuidance = `
**RESUME-FIRST MODE - GAP ANALYSIS STRATEGY:**

Based on analysis, the candidate's existing resume has:
- **Strengths:** ${gapAnalysis.strengths?.join(', ') || 'Well-structured content'}
- **Weaknesses:** ${gapAnalysis.weaknesses?.join(', ') || 'Some areas need enhancement'}
- **Missing Content:** ${gapAnalysis.missingContent?.join(', ') || 'None identified'}
- **Current ATS Match:** ${gapAnalysis.atsMatchScore || 0}% (Target: 85%+)

**CRITICAL INSTRUCTIONS FOR HYBRID RESUME:**
1. KEEP all strong existing content from their resume (strengths listed above)
2. ENHANCE weak sections with specific examples and metrics from conversation answers
3. FILL gaps by integrating missing required skills/experience from answers
4. DO NOT remove good existing content - build upon it
5. Result should be 85-95% ATS match with employer's exact language

**EXISTING RESUME CONTENT:**
${existingResume}

**CONVERSATION ANSWERS (To fill gaps):**
${personalStories || 'No additional information provided'}
`;
  }

  const hasContent = (resumeText && resumeText.length > 20) || (personalStories && personalStories.length > 20);
  const isResumeFirstMode = !!existingResume;

  return `You are an elite-level professional resume writer and career strategist with 15+ years of experience.

${personalityGuidance}

${gapAnalysisGuidance}

**TARGET JOB DESCRIPTION:**
${jobDescription}

${!isResumeFirstMode ? `
**CANDIDATE'S BACKGROUND:**
${resumeText || 'No formal resume provided - extract experience from personal stories below'}

**PERSONAL ACHIEVEMENTS & STORIES:**
${personalStories || 'Limited information - create professional examples based on job requirements'}
` : ''}

**REQUIRED SECTIONS:**
${Array.isArray(selectedSections) ? selectedSections.join(', ') : selectedSections}

**INSTRUCTIONS:**
${isResumeFirstMode
  ? '1. Use the HYBRID approach: Keep strong existing content, enhance weak sections, fill gaps with conversation answers'
  : hasContent
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
    const { resumeText, personalStories, jobDescription, selectedSections, targetCompany, sessionId } = req.body;

    if (!jobDescription || !selectedSections || selectedSections.length === 0) {
      return res.status(400).json({ error: 'Job description and sections required' });
    }

    const startTime = Date.now();

    // NEW: If sessionId provided, extract conversation answers from database
    let conversationAnswers = personalStories; // Fallback to old way if no sessionId

    if (sessionId) {
      console.log(`📋 Loading conversation answers from sessionId: ${sessionId}`);
      const conversation = await prisma.conversation.findFirst({
        where: {
          userId: userRecord.id,
          sessionId
        },
        select: { messages: true }
      });

      if (conversation && conversation.messages) {
        // Extract user answers and format as personal stories
        conversationAnswers = conversation.messages
          .filter(msg => msg.role === 'user')
          .map((msg, idx) => `Q${idx + 1}: ${msg.content}`)
          .join('\n\n');

        console.log(`✅ Loaded ${conversation.messages.filter(m => m.role === 'user').length} answers from conversation`);
      } else {
        console.warn('⚠️ SessionId provided but no conversation found, using personalStories fallback');
      }
    }

    // Load personality (should already exist from /conversation/complete)
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

    if (!personality) {
      console.warn('⚠️ No personality profile found - resume will lack personality framing');
    }

    // NEW: Load gap analysis if sessionId provided (resume-first mode)
    let gapAnalysis = null;
    let existingResumeFromSession = null;

    if (sessionId) {
      // Access jdSessions map from conversation.js (in-memory store)
      // TODO: In production, move to Redis or database
      const conversationModule = require('./conversation');
      const jdSession = conversationModule.jdSessions?.get(sessionId);

      if (jdSession) {
        gapAnalysis = jdSession.analysis?.resumeGapAnalysis;
        existingResumeFromSession = jdSession.existingResume;

        if (gapAnalysis) {
          console.log(`✅ Gap analysis loaded: ${gapAnalysis.questionCount} questions asked, ATS match: ${gapAnalysis.atsMatchScore}%`);
        }
      }
    }

    // Build prompt (use conversation answers if available, plus gap analysis for resume-first)
    const prompt = buildResumePrompt({
      resumeText,
      personalStories: conversationAnswers, // Now uses conversation answers if sessionId provided
      jobDescription,
      selectedSections: Array.isArray(selectedSections) ? selectedSections : selectedSections.split(','),
      personality,
      gapAnalysis, // NEW: Gap analysis from JD analyzer
      existingResume: existingResumeFromSession // NEW: Original resume for hybrid mode
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

    // Generate filename
    const filename = resume.targetCompany
      ? `Resume-${resume.targetCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : `Resume-${new Date().toISOString().split('T')[0]}.pdf`;

    // Upload to Cloud Storage (if enabled in production)
    let cloudStorageInfo = null;
    if (process.env.ENABLE_CLOUD_STORAGE === 'true') {
      try {
        console.log('Uploading PDF to Cloud Storage...');
        const uploadResult = await cloudStorageService.uploadPDF(
          pdfBuffer,
          userRecord.id,
          id,
          filename
        );

        // Generate signed URL (7-day expiry)
        const signedUrl = await cloudStorageService.generateSignedUrl(uploadResult.gsPath, 168);

        cloudStorageInfo = {
          gsPath: uploadResult.gsPath,
          bucket: uploadResult.bucket,
          signedUrl,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        };

        console.log(`✅ PDF uploaded to Cloud Storage: ${uploadResult.gsPath}`);

        // Update resume with Cloud Storage info + engagement tracking
        await prisma.resume.update({
          where: { id },
          data: {
            downloadedAt: new Date(),
            pdfTemplate: template,
            pdfUrl: signedUrl,
            pdfBucket: uploadResult.bucket,
            pdfPath: uploadResult.gsPath,
            viewedCount: { increment: 1 },
            lastViewedAt: new Date()
          }
        });

      } catch (error) {
        console.error('Cloud Storage upload failed (non-blocking):', error);
        // Continue with direct download even if upload fails
      }
    } else {
      // Mark as downloaded (no Cloud Storage) + engagement tracking
      await prisma.resume.update({
        where: { id },
        data: {
          downloadedAt: new Date(),
          pdfTemplate: template,
          viewedCount: { increment: 1 },
          lastViewedAt: new Date()
        }
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Generation-Time-Ms', generationTime);

    if (cloudStorageInfo) {
      res.setHeader('X-Cloud-Storage-Path', cloudStorageInfo.gsPath);
      res.setHeader('X-Signed-Url', cloudStorageInfo.signedUrl);
    }

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
 * GET /api/resume/:id/cloud-url
 * Get Cloud Storage signed URL for a resume PDF
 * Query params: expiryHours (default 168 = 7 days)
 */
router.get('/:id/cloud-url', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { expiryHours = 168 } = req.query;

    // Get user ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    const resume = await prisma.resume.findFirst({
      where: { id, userId: userRecord.id },
      select: {
        pdfPath: true,
        pdfBucket: true,
        pdfUrl: true,
        title: true
      }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    if (!resume.pdfPath) {
      return res.status(404).json({
        error: 'PDF not found in Cloud Storage',
        message: 'Generate PDF with Cloud Storage enabled first'
      });
    }

    // Check if existing URL is still valid
    if (resume.pdfUrl) {
      // Extract expiry from existing signed URL (simplified check)
      // In production, you'd parse the 'Expires' query param
      console.log('Existing signed URL found, regenerating for fresh expiry...');
    }

    // Generate new signed URL
    const signedUrl = await cloudStorageService.generateSignedUrl(
      resume.pdfPath,
      parseInt(expiryHours, 10)
    );

    // Update resume with new signed URL
    await prisma.resume.update({
      where: { id },
      data: { pdfUrl: signedUrl }
    });

    return res.json({
      success: true,
      signedUrl,
      expiresIn: `${expiryHours} hours`,
      expiresAt: new Date(Date.now() + (parseInt(expiryHours, 10) * 60 * 60 * 1000)),
      bucket: resume.pdfBucket,
      path: resume.pdfPath
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    next(error);
  }
});

/**
 * POST /api/resume/:id/report-outcome
 * Report resume outcome (interview, offer, salary) - Phase 7: Data Moat
 */
router.post('/:id/report-outcome', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const {
      interviewReceived,
      interviewReceivedAt,
      jobOfferReceived,
      jobOfferReceivedAt,
      salaryOffered,
      outcomeNotes
    } = req.body;

    // Get user ID
    const userRecord = await prisma.user.findUnique({
      where: { firebaseUid: user.firebaseUid },
      select: { id: true }
    });

    // Verify resume ownership
    const resume = await prisma.resume.findFirst({
      where: { id, userId: userRecord.id },
      select: { id: true, title: true }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Update outcome data
    const updateData = {
      outcomeReportedAt: new Date()
    };

    if (interviewReceived !== undefined) {
      updateData.interviewReceived = interviewReceived;
      if (interviewReceived && interviewReceivedAt) {
        updateData.interviewReceivedAt = new Date(interviewReceivedAt);
      }
    }

    if (jobOfferReceived !== undefined) {
      updateData.jobOfferReceived = jobOfferReceived;
      if (jobOfferReceived && jobOfferReceivedAt) {
        updateData.jobOfferReceivedAt = new Date(jobOfferReceivedAt);
      }
      if (jobOfferReceived && salaryOffered) {
        updateData.salaryOffered = salaryOffered;
      }
    }

    if (outcomeNotes) {
      updateData.outcomeNotes = outcomeNotes;
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        interviewReceived: true,
        interviewReceivedAt: true,
        jobOfferReceived: true,
        jobOfferReceivedAt: true,
        salaryOffered: true,
        outcomeReportedAt: true,
        outcomeNotes: true
      }
    });

    console.log(`✅ Outcome reported for resume ${id}: interview=${interviewReceived}, offer=${jobOfferReceived}`);

    return res.json({
      success: true,
      message: 'Thank you for helping us improve! Your data helps others succeed.',
      outcome: updated
    });

  } catch (error) {
    console.error('Report outcome error:', error);
    next(error);
  }
});

/**
 * GET /api/resume/:id/outcome
 * Get reported outcome for a resume - Phase 7: Data Moat
 */
router.get('/:id/outcome', verifyFirebaseToken, async (req, res, next) => {
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
        id: true,
        title: true,
        targetCompany: true,
        createdAt: true,
        downloadedAt: true,
        interviewReceived: true,
        interviewReceivedAt: true,
        jobOfferReceived: true,
        jobOfferReceivedAt: true,
        salaryOffered: true,
        outcomeReportedAt: true,
        outcomeNotes: true,
        viewedCount: true,
        sharedCount: true,
        lastViewedAt: true
      }
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.json({
      success: true,
      resume,
      hasOutcome: resume.outcomeReportedAt !== null
    });

  } catch (error) {
    console.error('Get outcome error:', error);
    next(error);
  }
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

    // Mark as downloaded + increment view count
    await prisma.resume.update({
      where: { id },
      data: {
        downloadedAt: new Date(),
        viewedCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    });

    // Return markdown as downloadable file
    const filename = `${resume.title || 'resume'}.md`.replace(/[^a-z0-9\-_.]/gi, '_');
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(resume.resumeMarkdown);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resume/extract-text
 * Extract text from uploaded resume files (PDF, DOCX, TXT)
 * Supports up to 5 files for merging multiple resume versions
 */
const multer = require('multer');
const { extractTextFromPdf } = require('../utils/pdf-parser');
const { extractTextFromDocx } = require('../utils/docx-parser');
const fs = require('fs');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain' // TXT
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// Resume file upload endpoint - extracts text from PDF/DOCX/TXT files
router.post('/extract-text', verifyFirebaseToken, (req, res, next) => {
  upload.array('resumes', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large',
            message: 'Each file must be less than 5MB'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files',
            message: 'Maximum 5 files allowed'
          });
        }
      }
      return res.status(400).json({
        error: 'Upload failed',
        message: err.message
      });
    }
    next();
  });
}, async (req, res, next) => {
  const tempFiles = [];

  try {
    console.log(`📤 Upload request received. Files:`, req.files ? req.files.length : 0);

    if (!req.files || req.files.length === 0) {
      console.log('❌ No files in request');
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload at least one resume file (PDF, DOCX, or TXT)'
      });
    }

    console.log(`📄 Extracting text from ${req.files.length} resume file(s)...`);

    const extractedTexts = [];

    for (const file of req.files) {
      let extractedText = '';

      if (file.mimetype === 'text/plain') {
        extractedText = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/pdf') {
        const tempPath = path.join('/tmp', `resume-${Date.now()}-${file.originalname}`);
        tempFiles.push(tempPath);
        fs.writeFileSync(tempPath, file.buffer);
        extractedText = await extractTextFromPdf(tempPath);
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        const tempPath = path.join('/tmp', `resume-${Date.now()}-${file.originalname}`);
        tempFiles.push(tempPath);
        fs.writeFileSync(tempPath, file.buffer);
        extractedText = await extractTextFromDocx(tempPath);
      }

      if (extractedText && extractedText.trim().length > 0) {
        extractedTexts.push({
          filename: file.originalname,
          text: extractedText.trim(),
          length: extractedText.trim().length
        });
      }
    }

    // Cleanup temp files
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    });

    if (extractedTexts.length === 0) {
      return res.status(400).json({
        error: 'No text extracted',
        message: 'Could not extract text from the uploaded files.'
      });
    }

    // Merge all extracted texts if multiple files
    const mergedText = extractedTexts.map((item, index) => {
      if (extractedTexts.length > 1) {
        return `\n\n=== Resume ${index + 1}: ${item.filename} ===\n\n${item.text}`;
      }
      return item.text;
    }).join('\n\n');

    console.log(`✅ Successfully extracted ${mergedText.length} characters from ${extractedTexts.length} file(s)`);

    res.status(200).json({
      success: true,
      text: mergedText,
      files: extractedTexts.map(item => ({
        filename: item.filename,
        length: item.length
      })),
      totalLength: mergedText.length,
      message: `Successfully extracted text from ${extractedTexts.length} file(s)`
    });

  } catch (error) {
    // Cleanup temp files on error
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    });

    console.error('❌ Resume text extraction error:', error);
    next(error);
  }
});

module.exports = router;
