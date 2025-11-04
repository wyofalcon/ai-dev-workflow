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
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * POST /api/conversation/start
 * Start a new conversational profile building session
 */
router.post('/start', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;

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

    // Get first question
    const firstQuestion = getNextQuestion(-1); // -1 to get question at index 0

    if (!firstQuestion) {
      return res.status(500).json({
        error: 'Question Framework Error',
        message: 'Unable to load first question',
      });
    }

    // Create welcome message
    const welcomeMessage = `Hi ${user.displayName || 'there'}! 👋

I'm here to help you build an amazing resume that showcases your unique strengths and personality.

I'll ask you about 16 questions covering your experience, achievements, and work style. This should take about 5-10 minutes. You can save and continue later anytime.

Ready to get started?`;

    // Store welcome message in database
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId,
        messageRole: 'assistant',
        messageContent: welcomeMessage,
        messageOrder: 0,
        questionId: null,
        questionCategory: null,
        modelUsed: null,
        tokensUsed: 0,
        responseTimeMs: 0,
      },
    });

    // Store first question
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId,
        messageRole: 'assistant',
        messageContent: firstQuestion.questionText,
        messageOrder: 1,
        questionId: firstQuestion.id,
        questionCategory: firstQuestion.category,
        modelUsed: null,
        tokensUsed: 0,
        responseTimeMs: 0,
      },
    });

    res.status(201).json({
      message: 'Conversation started successfully',
      sessionId,
      currentQuestion: {
        id: firstQuestion.id,
        text: firstQuestion.questionText,
        category: firstQuestion.category,
        order: firstQuestion.order,
      },
      progress: {
        current: 0,
        total: getTotalQuestions(),
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

    // Get conversation history for this session
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

    // Get current question details
    const currentQuestion = currentQuestionId ? getQuestionById(currentQuestionId) : null;
    const currentQuestionIndex = currentQuestion ? currentQuestion.order - 1 : 0;

    // Store user's response
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId,
        messageRole: 'user',
        messageContent: message,
        messageOrder: history.length,
        questionId: currentQuestionId,
        questionCategory: currentQuestion?.category || null,
        modelUsed: null,
        tokensUsed: 0,
        responseTimeMs: 0,
      },
    });

    // Check if there's a follow-up question
    let nextMessageContent = null;
    let nextQuestionData = null;

    if (currentQuestion?.followUp) {
      // Send follow-up question
      nextMessageContent = currentQuestion.followUp;
      nextQuestionData = currentQuestion; // Same question, just follow-up
    } else {
      // Get next question
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

    // Store assistant's response (next question or completion message)
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId,
        messageRole: 'assistant',
        messageContent: nextMessageContent,
        messageOrder: history.length + 1,
        questionId: nextQuestionData?.id || null,
        questionCategory: nextQuestionData?.category || null,
        modelUsed: 'gemini-1.5-flash',
        tokensUsed: 0, // Will add actual token tracking when Gemini is enabled
        responseTimeMs: Date.now() - startTime,
      },
    });

    const isComplete = !nextQuestionData;
    const progress = getProgress(currentQuestionIndex);

    res.status(200).json({
      message: 'Message processed successfully',
      response: nextMessageContent,
      nextQuestion: nextQuestionData
        ? {
            id: nextQuestionData.id,
            text: nextQuestionData.questionText,
            category: nextQuestionData.category,
            order: nextQuestionData.order,
          }
        : null,
      progress: {
        current: currentQuestionIndex + 1,
        total: getTotalQuestions(),
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

    // Find last assistant message to determine current question
    const lastAssistantMessage = [...history]
      .reverse()
      .find((msg) => msg.messageRole === 'assistant');

    const currentQuestion = lastAssistantMessage?.questionId
      ? getQuestionById(lastAssistantMessage.questionId)
      : null;

    const currentQuestionIndex = currentQuestion ? currentQuestion.order - 1 : history.length;

    res.status(200).json({
      sessionId,
      messages: history,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.questionText,
            category: currentQuestion.category,
            order: currentQuestion.order,
          }
        : null,
      progress: {
        current: currentQuestionIndex,
        total: getTotalQuestions(),
        percentage: getProgress(currentQuestionIndex),
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
    const profileCompleteness = Math.round((userMessages.length / getTotalQuestions()) * 100);

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
