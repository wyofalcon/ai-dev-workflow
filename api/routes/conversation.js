const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { verifyFirebaseToken } = require("../middleware/authMiddleware");
// Use factory to auto-switch between mock (free) and Vertex AI (GCP)
const { geminiService } = require("../services/geminiServiceFactory");
const {
  getNextQuestion,
  getQuestionById,
  getTotalQuestions,
  getProgress,
} = require("../services/questionFramework");
const { inferPersonality } = require("../services/personalityInference");
const {
  inferPersonalityWithGemini,
} = require("../services/personalityInferenceGemini");
const JobDescriptionAnalyzer = require("../services/jobDescriptionAnalyzer");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

/**
 * POST /api/conversation/start
 * Start a new conversational profile building session
 * NOW SUPPORTS: jobDescription parameter for JD-specific questions
 */
router.post("/start", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { jobDescription, existingResume } = req.body; // NEW: Accept existingResume for gap analysis

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, displayName: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    // Create new session ID
    const sessionId = uuidv4();

    let firstQuestion;
    let jdAnalysis = null;
    let questionsToUse = "generic";

    // If job description provided, analyze it and use JD-specific questions
    // If existingResume also provided, perform gap analysis for targeted questions
    if (jobDescription && jobDescription.trim().length >= 50) {
      try {
        const hasResume = existingResume && existingResume.trim().length >= 100;

        if (hasResume) {
          console.log(
            "📋 Analyzing job description + existing resume for gap-filling questions..."
          );
        } else {
          console.log("📋 Analyzing job description for targeted questions...");
        }

        const analyzer = new JobDescriptionAnalyzer(geminiService);
        const validation = analyzer.validateJobDescription(jobDescription);

        if (validation.valid) {
          // Pass existingResume to analyzer for gap analysis
          const analysis = await analyzer.analyze(
            jobDescription,
            existingResume || null
          );
          jdAnalysis = analysis;

          // JD session data will be stored in database (not in-memory Map)
          // This ensures persistence across Cloud Run restarts/scaling (Issue #17 fix)

          // Use first JD-specific question
          firstQuestion = {
            id: analysis.questions[0].id,
            questionText: analysis.questions[0].question,
            category: analysis.questions[0].type,
            order: 1,
            purpose: analysis.questions[0].purpose,
            keywords: analysis.questions[0].keywords,
            followUp: analysis.questions[0].followUp,
          };

          questionsToUse = "jd-specific";

          console.log("✅ JD analysis complete:", {
            jobTitle: analysis.analysis.jobTitle,
            experienceLevel: analysis.analysis.experienceLevel,
            questionsGenerated: analysis.questions.length,
          });
        } else {
          console.warn("⚠️ JD validation failed:", validation.reason);
          // Fall back to generic questions
          firstQuestion = getNextQuestion(-1);
        }
      } catch (error) {
        console.error(
          "❌ JD analysis failed, falling back to generic questions:",
          error
        );
        // Fall back to generic questions
        firstQuestion = getNextQuestion(-1);
      }
    } else {
      // No JD provided or too short - use generic personality questions
      firstQuestion = getNextQuestion(-1);
    }

    if (!firstQuestion) {
      return res.status(500).json({
        error: "Question Framework Error",
        message: "Unable to load first question",
      });
    }

    // Create welcome message (adjusted for resume-first mode)
    const hasResumeGapAnalysis = jdAnalysis?.hasResume;
    const gapAnalysis = jdAnalysis?.analysis?.resumeGapAnalysis;

    const welcomeMessage = `Hi ${user.displayName || "there"}! 👋

I'm here to help you build an amazing resume that showcases your unique strengths and personality.

${
  jdAnalysis
    ? hasResumeGapAnalysis
      ? `Great news! I analyzed the **${
          jdAnalysis.analysis.jobTitle
        }** position and compared it to your existing resume. I found ${
          gapAnalysis?.questionCount || jdAnalysis.questions.length
        } key areas where we can strengthen your application with specific examples.`
      : `Great news! I analyzed the **${jdAnalysis.analysis.jobTitle}** position and will ask you ${jdAnalysis.questions.length} targeted questions specifically about this role.`
    : "I'll ask you about 16 questions covering your experience, achievements, and work style."
}

This should take about ${
      hasResumeGapAnalysis ? "5-8 minutes" : "10-15 minutes"
    }. You can save and continue later anytime.

Ready to get started?`;

    // Store conversation in database (messages as JSON array)
    // Issue #17 fix: JD session state now stored in DB (not in-memory Map)
    // This ensures persistence across Cloud Run restarts/scaling
    await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId: sessionId,
        messages: [
          {
            role: "assistant",
            content: welcomeMessage,
            timestamp: new Date().toISOString(),
          },
          {
            role: "assistant",
            content: firstQuestion.questionText,
            questionId: firstQuestion.id,
            questionCategory: firstQuestion.category,
            timestamp: new Date().toISOString(),
          },
        ],
        existingResume: existingResume || null,
        gapAnalysis: jdAnalysis?.analysis?.resumeGapAnalysis || null,
        jobDescription: jobDescription || null,
        // JD Session State (Issue #17 fix - replaces in-memory Map)
        jdAnalysis: jdAnalysis?.analysis || null,
        jdQuestions: jdAnalysis?.questions || null,
        currentQuestionIndex: 0,
        hasResume: !!existingResume,
        status: "active",
      },
    });

    const totalQuestions = jdAnalysis
      ? jdAnalysis.questions.length
      : getTotalQuestions();

    res.status(201).json({
      message: "Conversation started successfully",
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
    console.error("❌ Error starting conversation:", error);
    next(error);
  }
});

/**
 * POST /api/conversation/message
 * Process user's response and get next question
 * NOW SUPPORTS: JD-specific question flow
 */
router.post("/message", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { sessionId, message, currentQuestionId } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        error: "Missing Required Fields",
        message: "sessionId and message are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    const startTime = Date.now();

    // Get conversation for this session (Issue #17 fix: uses sessionId lookup with index)
    const conversation = await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        sessionId: sessionId,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Session Not Found",
        message: "Conversation session not found",
      });
    }

    const history = conversation.messages || [];

    // Check if this is a JD-specific session (Issue #17 fix: read from DB, not in-memory Map)
    const isJDSession =
      conversation.jdQuestions && conversation.jdQuestions.length > 0;

    let currentQuestion;
    let currentQuestionIndex;
    let totalQuestions;

    if (isJDSession) {
      // Use JD-specific questions from database
      currentQuestionIndex = conversation.currentQuestionIndex;
      const jdQuestions = conversation.jdQuestions;
      currentQuestion = jdQuestions[currentQuestionIndex];
      totalQuestions = jdQuestions.length;
    } else {
      // Use generic personality questions
      currentQuestion = currentQuestionId
        ? getQuestionById(currentQuestionId)
        : null;
      currentQuestionIndex = currentQuestion ? currentQuestion.order - 1 : 0;
      totalQuestions = getTotalQuestions();
    }

    // Store user's response in messages array
    const updatedMessages = [
      ...history,
      {
        role: "user",
        content: message,
        questionId: currentQuestionId,
        questionCategory:
          currentQuestion?.category || currentQuestion?.type || null,
        timestamp: new Date().toISOString(),
      },
    ];

    // Get next question (removed followUp logic that was causing duplicates)
    let nextMessageContent = null;
    let nextQuestionData = null;

    if (isJDSession) {
      const nextIndex = currentQuestionIndex + 1;
      const jdQuestions = conversation.jdQuestions;

      if (nextIndex < jdQuestions.length) {
        const nextQ = jdQuestions[nextIndex];
        nextQuestionData = {
          id: nextQ.id,
          questionText: nextQ.question,
          category: nextQ.type,
          order: nextIndex + 1,
          purpose: nextQ.purpose,
          keywords: nextQ.keywords,
        };
        nextMessageContent = nextQ.question;
      } else {
        // All JD questions complete!
        const jobTitle = conversation.jdAnalysis?.jobTitle || "this";
        nextMessageContent = `Amazing! 🎉 We've completed your profile for the **${jobTitle}** position.

I now have a great understanding of how your experience aligns with this role.

Your profile is being saved. Next, you'll be able to generate a tailored resume for this specific job!`;
        nextQuestionData = null;
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
        role: "assistant",
        content: nextMessageContent,
        questionId: nextQuestionData?.id || null,
        questionCategory:
          nextQuestionData?.category || nextQuestionData?.type || null,
        modelUsed: isJDSession ? "gemini-2.0-flash" : "gemini-1.5-flash",
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Update conversation with new messages and JD session state (Issue #17 fix)
    const updateData = {
      messages: updatedMessages,
      status: nextQuestionData ? "active" : "completed",
      completedAt: nextQuestionData ? null : new Date(),
    };

    // Update currentQuestionIndex for JD sessions
    if (isJDSession) {
      updateData.currentQuestionIndex = currentQuestionIndex + 1;
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: updateData,
    });

    const isComplete = !nextQuestionData;
    const progress = Math.round(
      ((currentQuestionIndex + 1) / totalQuestions) * 100
    );

    res.status(200).json({
      message: "Message processed successfully",
      response: nextMessageContent,
      nextQuestion: nextQuestionData
        ? {
            id: nextQuestionData.id,
            text: nextQuestionData.questionText || nextQuestionData.question,
            category: nextQuestionData.category || nextQuestionData.type,
            order: nextQuestionData.order || currentQuestionIndex + 2,
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
    console.error("❌ Error processing message:", error);
    next(error);
  }
});

/**
 * GET /api/conversation/history/:sessionId
 * Get conversation history for a session
 */
router.get(
  "/history/:sessionId",
  verifyFirebaseToken,
  async (req, res, next) => {
    try {
      const { firebaseUid } = req.user;
      const { sessionId } = req.params;

      const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({
          error: "User Not Found",
          message: "User account not found",
        });
      }

      // Issue #17 fix: Get conversation with JD session data from DB
      const conversation = await prisma.conversation.findFirst({
        where: {
          userId: user.id,
          sessionId,
        },
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Session Not Found",
          message: "Conversation session not found",
        });
      }

      const messages = conversation.messages || [];

      // Check if this is a JD-specific session (Issue #17 fix: read from DB)
      const isJDSession =
        conversation.jdQuestions && conversation.jdQuestions.length > 0;

      // Find last assistant message to determine current question
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");

      let currentQuestion;
      let currentQuestionIndex;
      let totalQuestions;

      if (isJDSession) {
        currentQuestionIndex = conversation.currentQuestionIndex;
        const jdQuestions = conversation.jdQuestions;
        currentQuestion =
          currentQuestionIndex < jdQuestions.length
            ? jdQuestions[currentQuestionIndex]
            : null;
        totalQuestions = jdQuestions.length;
      } else {
        currentQuestion = lastAssistantMessage?.questionId
          ? getQuestionById(lastAssistantMessage.questionId)
          : null;
        currentQuestionIndex = currentQuestion
          ? currentQuestion.order - 1
          : messages.length;
        totalQuestions = getTotalQuestions();
      }

      const progress = Math.round(
        ((currentQuestionIndex + 1) / totalQuestions) * 100
      );

      res.status(200).json({
        sessionId,
        messages: messages,
        currentQuestion: currentQuestion
          ? {
              id: currentQuestion.id,
              text: currentQuestion.questionText || currentQuestion.question,
              category: currentQuestion.category || currentQuestion.type,
              order: currentQuestion.order || currentQuestionIndex + 1,
            }
          : null,
        progress: {
          current: currentQuestionIndex,
          total: totalQuestions,
          percentage: progress,
        },
        status: conversation.status,
      });
    } catch (error) {
      console.error("❌ Error fetching conversation history:", error);
      next(error);
    }
  }
);

/**
 * POST /api/conversation/complete
 * Finalize profile building - extract data and save to user_profiles
 */
router.post("/complete", verifyFirebaseToken, async (req, res, next) => {
  try {
    const { firebaseUid } = req.user;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing Required Fields",
        message: "sessionId is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "User Not Found",
        message: "User account not found",
      });
    }

    // Get conversation history with JD session data (Issue #17 fix)
    const conversation = await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        sessionId,
      },
      select: { id: true, messages: true, jdQuestions: true },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Session Not Found",
        message: "Conversation session not found",
      });
    }

    const messages = conversation.messages || [];

    if (messages.length === 0) {
      return res.status(400).json({
        error: "Empty Conversation",
        message: "No messages found in conversation",
      });
    }

    // Infer personality traits from conversation using Gemini (with 45s timeout)
    console.log("🧠 Starting Gemini-based personality inference...");
    const inferenceStartTime = Date.now();
    const personality = await inferPersonalityWithGemini(messages, 45000);
    const inferenceTime = Date.now() - inferenceStartTime;
    console.log(
      `⏱️ Personality inference completed in ${inferenceTime}ms (confidence: ${personality.inferenceConfidence})`
    );

    // Calculate profile completeness based on answered questions
    const userMessages = messages.filter((msg) => msg.role === "user");

    // Check if this was a JD session (Issue #17 fix: read from DB, not in-memory Map)
    const isJDSession =
      conversation.jdQuestions && conversation.jdQuestions.length > 0;
    const totalQuestions = isJDSession
      ? conversation.jdQuestions.length
      : getTotalQuestions();

    // Mark session as completed in database (Issue #17 fix)
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Update or create user profile (ensure it exists)
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
      },
    });

    // Save personality traits
    await prisma.personalityTraits.upsert({
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
      message: "Profile completed successfully",
      personality,
      nextStep: "generate_resume",
      metadata: {
        inferenceTime,
        confidence: personality.inferenceConfidence,
        analysisVersion: personality.analysisVersion,
      },
    });
  } catch (error) {
    console.error("❌ Error completing profile:", error);
    console.error("Error stack:", error.stack);

    // Return user-friendly error with fallback suggestion
    const errorMessage = error.message.includes("timeout")
      ? "Personality analysis is taking longer than expected. Please try again, or skip to use a generic profile."
      : "Unable to complete personality analysis. Please try again.";

    res.status(500).json({
      error: "Profile Completion Error",
      message: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      canRetry: true,
      fallbackAvailable: true,
    });
  }
});

module.exports = router;
