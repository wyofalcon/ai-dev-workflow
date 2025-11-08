const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
// Use Vertex AI service (GCP native, no API key needed)
const geminiService = require('../services/geminiServiceVertex');
const {
  getNextQuestion,
  getQuestionById,
  getTotalQuestions,
  getProgress,
} = require('../services/questionFramework');
const { inferPersonality } = require('../services/personalityInference');
const JobDescriptionAnalyzer = require('../services/jobDescriptionAnalyzer');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Store JD-specific question sessions in memory (will be replaced with Redis in production)
const jdSessions = new Map();

/**
 * POST /api/conversation/start
 * Start a new conversational profile building session
 * NOW SUPPORTS: jobDescription parameter for JD-specific questions
 */
router.post('/start', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { jobDescription } = req.body; // NEW: Accept job description

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, displayName: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User account not found',
      });
    }

    // Create new session ID
    const sessionId = uuidv4();

    let firstQuestion;
    let jdAnalysis = null;
    let questionsToUse = 'generic';

    // If job description provided, analyze it and use JD-specific questions
    if (jobDescription && jobDescription.trim().length >= 50) {
      try {
        console.log('📋 Analyzing job description for targeted questions...');

        const analyzer = new JobDescriptionAnalyzer(geminiService);
        const validation = analyzer.validateJobDescription(jobDescription);

        if (validation.valid) {
          const analysis = await analyzer.analyze(jobDescription);
          jdAnalysis = analysis;

          // Store JD analysis and questions for this session
          jdSessions.set(sessionId, {
            analysis: analysis.analysis,
            questions: analysis.questions,
            currentQuestionIndex: 0,
            jobDescription
          });

          // Use first JD-specific question
          firstQuestion = {
            id: analysis.questions[0].id,
            questionText: analysis.questions[0].question,
            category: analysis.questions[0].type,
            order: 1,
            purpose: analysis.questions[0].purpose,
            keywords: analysis.questions[0].keywords,
            followUp: analysis.questions[0].followUp
          };

          questionsToUse = 'jd-specific';

          console.log('✅ JD analysis complete:', {
            jobTitle: analysis.analysis.jobTitle,
            experienceLevel: analysis.analysis.experienceLevel,
            questionsGenerated: analysis.questions.length
          });
        } else {
          console.warn('⚠️ JD validation failed:', validation.reason);
          // Fall back to generic questions
          firstQuestion = getNextQuestion(-1);
        }
      } catch (error) {
        console.error('❌ JD analysis failed, falling back to generic questions:', error);
        // Fall back to generic questions
        firstQuestion = getNextQuestion(-1);
      }
    } else {
      // No JD provided or too short - use generic personality questions
      firstQuestion = getNextQuestion(-1);
    }

    if (!firstQuestion) {
      return res.status(500).json({
        error: 'Question Framework Error',
        message: 'Unable to load first question',
      });
    }

    // Create welcome message
    const welcomeMessage = `Hi ${user.displayName || 'there'}! 👋

I'm here to help you build an amazing resume that showcases your unique strengths and personality.

${jdAnalysis
  ? `Great news! I analyzed the **${jdAnalysis.analysis.jobTitle}** position and will ask you ${jdAnalysis.questions.length} targeted questions specifically about this role.`
  : 'I\'ll ask you about 16 questions covering your experience, achievements, and work style.'
}

This should take about 5-10 minutes. You can save and continue later anytime.

Ready to get started?`;

    // Store conversation in database (messages as JSON array)
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId: sessionId,
        messages: [
          {
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: firstQuestion.questionText,
            questionId: firstQuestion.id,
            questionCategory: firstQuestion.category,
            timestamp: new Date().toISOString(),
          }
        ],
        // status: 'active', // Removed - column doesn't exist yet
      },
    });

    const totalQuestions = jdAnalysis ? jdAnalysis.questions.length : getTotalQuestions();

    res.status(201).json({
      message: 'Conversation started successfully',
      sessionId,
      questionsType: questionsToUse,
      jobTitle: jdAnalysis?.analysis?.jobTitle || null,
      currentQuestion: {
        id: firstQuestion.id,
        text: firstQuestion.questionText,
        category: firstQuestion.category,
        order: firstQuestion.order,
      },
      progress: {
        current: 0,
        total: totalQuestions,
        percentage: 0,
      },
    });
  } catch (error) {
    console.error('❌ Error starting conversation:', error);
    next(error);
  }
});

/**
 * POST /api/conversation/message
 * Process user's response and get next question
 * NOW SUPPORTS: JD-specific question flow
 */
router.post('/message', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { sessionId, message, currentQuestionId } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: 'Missing Required Fields',
        message: 'sessionId and message are required',
      });
    }

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

    const startTime = Date.now();

    // Get conversation for this session
    // Note: We're using sessionId from jdSessions Map, not from DB
    // The DB stores messages as JSON array in one row
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (conversations.length === 0) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'Conversation session not found',
      });
    }

    const conversation = conversations[0];
    const history = conversation.messages || [];

    // Check if this is a JD-specific session
    const jdSession = jdSessions.get(sessionId);
    const isJDSession = !!jdSession;

    let currentQuestion;
    let currentQuestionIndex;
    let totalQuestions;

    if (isJDSession) {
      // Use JD-specific questions
      currentQuestionIndex = jdSession.currentQuestionIndex;
      const jdQuestions = jdSession.questions;
      currentQuestion = jdQuestions[currentQuestionIndex];
      totalQuestions = jdQuestions.length;
    } else {
      // Use generic personality questions
      currentQuestion = currentQuestionId ? getQuestionById(currentQuestionId) : null;
      currentQuestionIndex = currentQuestion ? currentQuestion.order - 1 : 0;
      totalQuestions = getTotalQuestions();
    }

    // Store user's response in messages array
    const updatedMessages = [
      ...history,
      {
        role: 'user',
        content: message,
        questionId: currentQuestionId,
        questionCategory: currentQuestion?.category || currentQuestion?.type || null,
        timestamp: new Date().toISOString(),
      }
    ];

    // Get next question (removed followUp logic that was causing duplicates)
    let nextMessageContent = null;
    let nextQuestionData = null;

    if (isJDSession) {
      const nextIndex = currentQuestionIndex + 1;
      jdSession.currentQuestionIndex = nextIndex;

      if (nextIndex < jdSession.questions.length) {
        const nextQ = jdSession.questions[nextIndex];
        nextQuestionData = {
          id: nextQ.id,
          questionText: nextQ.question,
          category: nextQ.type,
          order: nextIndex + 1,
          purpose: nextQ.purpose,
          keywords: nextQ.keywords
        };
        nextMessageContent = nextQ.question;
      } else {
        // All JD questions complete!
        nextMessageContent = `Amazing! 🎉 We've completed your profile for the **${jdSession.analysis.jobTitle}** position.

I now have a great understanding of how your experience aligns with this role.

Your profile is being saved. Next, you'll be able to generate a tailored resume for this specific job!`;
        nextQuestionData = null;

        // Clean up session
        jdSessions.delete(sessionId);
      }
    } else {
      const nextQuestion = getNextQuestion(currentQuestionIndex);

      if (nextQuestion) {
        nextMessageContent = nextQuestion.questionText;
        nextQuestionData = nextQuestion;
      } else {
        // All questions complete!
        nextMessageContent = `Amazing! 🎉 We've completed your profile.

I now have a great understanding of your experience, achievements, and work style.

Your profile is being saved. Next, you'll be able to generate tailored resumes for specific job openings!`;
        nextQuestionData = null;
      }
    }

    // Add assistant's response to messages array
    if (nextMessageContent) {
      updatedMessages.push({
        role: 'assistant',
        content: nextMessageContent,
        questionId: nextQuestionData?.id || null,
        questionCategory: nextQuestionData?.category || nextQuestionData?.type || null,
        modelUsed: isJDSession ? 'gemini-2.0-flash' : 'gemini-1.5-flash',
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Update conversation with new messages
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: updatedMessages,
        // status: nextQuestionData ? 'active' : 'completed', // Removed - column doesn't exist yet
        // completedAt: nextQuestionData ? null : new Date(), // Removed - column doesn't exist yet
      },
    });

    const isComplete = !nextQuestionData;
    const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

    res.status(200).json({
      message: 'Message processed successfully',
      response: nextMessageContent,
      nextQuestion: nextQuestionData
        ? {
            id: nextQuestionData.id,
            text: nextQuestionData.questionText || nextQuestionData.question,
            category: nextQuestionData.category || nextQuestionData.type,
            order: nextQuestionData.order || (currentQuestionIndex + 2),
          }
        : null,
      progress: {
        current: currentQuestionIndex + 1,
        total: totalQuestions,
        percentage: progress,
      },
      isComplete,
    });
  } catch (error) {
    console.error('❌ Error processing message:', error);
    next(error);
  }
});

/**
 * GET /api/conversation/history/:sessionId
 * Get conversation history for a session
 */
router.get('/history/:sessionId', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { sessionId } = req.params;

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

    const history = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        sessionId,
      },
      orderBy: { messageOrder: 'asc' },
      select: {
        id: true,
        messageRole: true,
        messageContent: true,
        messageOrder: true,
        questionId: true,
        questionCategory: true,
        createdAt: true,
      },
    });

    if (history.length === 0) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'Conversation session not found',
      });
    }

    // Check if this is a JD-specific session
    const jdSession = jdSessions.get(sessionId);
    const isJDSession = !!jdSession;

    // Find last assistant message to determine current question
    const lastAssistantMessage = [...history]
      .reverse()
      .find((msg) => msg.messageRole === 'assistant');

    let currentQuestion;
    let currentQuestionIndex;
    let totalQuestions;

    if (isJDSession) {
      currentQuestionIndex = jdSession.currentQuestionIndex;
      const jdQuestions = jdSession.questions;
      currentQuestion = jdQuestions[currentQuestionIndex];
      totalQuestions = jdQuestions.length;
    } else {
      currentQuestion = lastAssistantMessage?.questionId
        ? getQuestionById(lastAssistantMessage.questionId)
        : null;
      currentQuestionIndex = currentQuestion ? currentQuestion.order - 1 : history.length;
      totalQuestions = getTotalQuestions();
    }

    const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

    res.status(200).json({
      sessionId,
      messages: history,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.questionText || currentQuestion.question,
            category: currentQuestion.category || currentQuestion.type,
            order: currentQuestion.order || (currentQuestionIndex + 1),
          }
        : null,
      progress: {
        current: currentQuestionIndex,
        total: totalQuestions,
        percentage: progress,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching conversation history:', error);
    next(error);
  }
});

/**
 * POST /api/conversation/complete
 * Finalize profile building - extract data and save to user_profiles
 */
router.post('/complete', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing Required Fields',
        message: 'sessionId is required',
      });
    }

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

    // Get conversation history
    const history = await prisma.conversation.findMany({
      where: {
        userId: user.id,
        sessionId,
      },
      orderBy: { messageOrder: 'asc' },
    });

    if (history.length === 0) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'Conversation session not found',
      });
    }

    // Infer personality traits from conversation
    const personality = inferPersonality(history);

    // Calculate profile completeness based on answered questions
    const userMessages = history.filter((msg) => msg.messageRole === 'user');

    // Check if this was a JD session
    const jdSession = jdSessions.get(sessionId);
    const totalQuestions = jdSession ? jdSession.questions.length : getTotalQuestions();
    const profileCompleteness = Math.round((userMessages.length / totalQuestions) * 100);

    // Clean up JD session if exists
    if (jdSession) {
      jdSessions.delete(sessionId);
    }

    // Update or create user profile (basic for now, will extract more data with Gemini later)
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        profileCompleteness,
        conversationCompleted: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        profileCompleteness,
        conversationCompleted: true,
      },
    });

    // Save personality traits
    await prisma.personalityTrait.upsert({
      where: { userId: user.id },
      update: {
        openness: personality.openness,
        conscientiousness: personality.conscientiousness,
        extraversion: personality.extraversion,
        agreeableness: personality.agreeableness,
        neuroticism: personality.neuroticism,
        workStyle: personality.workStyle,
        leadershipStyle: personality.leadershipStyle,
        communicationStyle: personality.communicationStyle,
        motivationType: personality.motivationType,
        decisionMaking: personality.decisionMaking,
        inferenceConfidence: personality.inferenceConfidence,
        analysisVersion: personality.analysisVersion,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        openness: personality.openness,
        conscientiousness: personality.conscientiousness,
        extraversion: personality.extraversion,
        agreeableness: personality.agreeableness,
        neuroticism: personality.neuroticism,
        workStyle: personality.workStyle,
        leadershipStyle: personality.leadershipStyle,
        communicationStyle: personality.communicationStyle,
        motivationType: personality.motivationType,
        decisionMaking: personality.decisionMaking,
        inferenceConfidence: personality.inferenceConfidence,
        analysisVersion: personality.analysisVersion,
      },
    });

    res.status(200).json({
      message: 'Profile completed successfully',
      profileCompleteness,
      personality,
      nextStep: 'generate_resume',
    });
  } catch (error) {
    console.error('❌ Error completing profile:', error);
    next(error);
  }
});

module.exports = router;
