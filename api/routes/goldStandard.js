/**
 * Gold Standard Personality Assessment Routes
 *
 * Premium feature (requires subscriptionTier = 'gold' or higher)
 * Provides 90%+ accurate OCEAN personality assessment
 *
 * Assessment Flow:
 * 1. POST /start - Initialize assessment session
 * 2. POST /answer - Save user answers (stories, Likert, hybrid)
 * 3. POST /complete - Trigger analysis and scoring
 * 4. GET /status - Check assessment progress
 * 5. GET /results - Retrieve OCEAN scores + insights
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { analyzePersonality } = require('../services/profileAnalyzer');
const { batchExtractStories } = require('../services/storyExtractor');
const { generateStoryEmbedding, formatEmbeddingForPgVector } = require('../services/embeddingGenerator');

/**
 * Middleware: Check if user has Gold Standard access
 */
async function checkGoldAccess(req, res, next) {
  try {
    const userId = req.user.firebaseUid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      select: { subscriptionTier: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check subscription tier
    const goldTiers = ['gold', 'platinum', 'enterprise'];
    if (!goldTiers.includes(user.subscriptionTier)) {
      return res.status(403).json({
        error: 'Gold Standard access required',
        message: 'This premium feature requires a Gold subscription or higher.',
        currentTier: user.subscriptionTier,
        upgradeUrl: '/upgrade'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking Gold access:', error);
    res.status(500).json({ error: 'Failed to verify access' });
  }
}

/**
 * POST /api/gold-standard/start
 * Initialize a new Gold Standard assessment session
 */
router.post('/start', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        personalityProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if assessment already completed
    if (user.personalityProfile?.isComplete) {
      return res.status(200).json({
        status: 'already_complete',
        message: 'You have already completed the Gold Standard assessment',
        profile: user.personalityProfile
      });
    }

    // Create or reset personality profile
    let profile;
    if (user.personalityProfile) {
      // Reset existing incomplete profile
      profile = await prisma.personalityProfile.update({
        where: { userId: user.id },
        data: {
          isComplete: false,
          assessmentVersion: 'hybrid-v3',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new profile
      profile = await prisma.personalityProfile.create({
        data: {
          userId: user.id,
          assessmentVersion: 'hybrid-v3',
          isComplete: false
        }
      });
    }

    // Delete any existing incomplete stories
    await prisma.profileStory.deleteMany({
      where: {
        userId: user.id,
        profileId: profile.id
      }
    });

    res.json({
      status: 'started',
      message: 'Gold Standard assessment session initialized',
      profileId: profile.id,
      sections: {
        stories: { total: 8, completed: 0 },
        likert: { total: 20, completed: 0 },
        hybrid: { total: 7, completed: 0 }
      }
    });

  } catch (error) {
    console.error('Error starting Gold Standard assessment:', error);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
});

/**
 * POST /api/gold-standard/answer
 * Save user's answers to the assessment
 *
 * Body:
 * {
 *   section: 'stories' | 'likert' | 'hybrid',
 *   answers: Array | Object
 * }
 */
router.post('/answer', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;
    const { section, answers } = req.body;

    if (!section || !answers) {
      return res.status(400).json({ error: 'Missing required fields: section, answers' });
    }

    // Get user and profile
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: { personalityProfile: true }
    });

    if (!user || !user.personalityProfile) {
      return res.status(404).json({ error: 'Assessment session not found. Please start the assessment first.' });
    }

    const profile = user.personalityProfile;

    // Save answers based on section
    switch (section) {
      case 'stories':
        // Save behavioral stories
        await saveStoryAnswers(user.id, profile.id, answers);
        break;

      case 'likert':
        // Save Likert scale responses
        await prisma.personalityProfile.update({
          where: { id: profile.id },
          data: {
            likertScores: answers // {q1: 4, q2: 2, ..., q20: 5}
          }
        });
        break;

      case 'hybrid':
        // Save hybrid question responses
        await saveHybridAnswers(user.id, profile.id, answers);
        break;

      default:
        return res.status(400).json({ error: 'Invalid section. Must be: stories, likert, or hybrid' });
    }

    res.json({
      status: 'saved',
      message: `${section} answers saved successfully`,
      section
    });

  } catch (error) {
    console.error('Error saving assessment answers:', error);
    res.status(500).json({ error: 'Failed to save answers' });
  }
});

/**
 * POST /api/gold-standard/complete
 * Finalize assessment and trigger analysis
 */
router.post('/complete', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    // Get user with all assessment data
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        personalityProfile: {
          include: {
            stories: true
          }
        }
      }
    });

    if (!user || !user.personalityProfile) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }

    const profile = user.personalityProfile;

    // Validate all sections completed
    if (!profile.likertScores) {
      return res.status(400).json({ error: 'Likert section not completed' });
    }

    const stories = profile.stories.filter(s =>
      ['achievement', 'adversity', 'team', 'innovation', 'helping', 'learning', 'values', 'passion']
        .includes(s.questionType)
    );

    if (stories.length < 8) {
      return res.status(400).json({
        error: 'Story section incomplete',
        completed: stories.length,
        required: 8
      });
    }

    const hybridStories = profile.stories.filter(s =>
      ['work_environment', 'project_management', 'stress_response', 'curiosity',
       'conflict_style', 'change_tolerance', 'motivation']
        .includes(s.questionType)
    );

    if (hybridStories.length < 7) {
      return res.status(400).json({
        error: 'Hybrid section incomplete',
        completed: hybridStories.length,
        required: 7
      });
    }

    console.log('🧠 Starting Gold Standard personality analysis...');

    // Extract story data for analysis
    const storyData = await batchExtractStories(
      stories.map(s => ({
        question_type: s.questionType,
        question_text: s.questionText,
        story_text: s.storyText
      }))
    );

    // Update stories with extracted data and generate embeddings
    for (const story of storyData) {
      // Generate embedding for semantic search
      const embedding = await generateStoryEmbedding(story);
      const embeddingStr = formatEmbeddingForPgVector(embedding);

      // Update story with AI analysis and embedding
      await prisma.$executeRawUnsafe(
        `UPDATE profile_stories
         SET story_summary = $1,
             category = $2,
             themes = $3,
             skills_demonstrated = $4,
             personality_signals = $5,
             relevance_tags = $6,
             embedding = $7::vector
         WHERE user_id = $8 AND profile_id = $9 AND question_type = $10`,
        story.story_summary,
        story.category,
        story.themes,
        story.skills_demonstrated,
        JSON.stringify(story.personality_signals),
        story.relevance_tags,
        embeddingStr,
        user.id,
        profile.id,
        story.question_type
      );
    }

    // Perform hybrid personality analysis
    const analysisResult = await analyzePersonality({
      likertResponses: profile.likertScores,
      stories: storyData,
      hybridAnswers: hybridStories.map(s => ({
        question: s.questionText,
        answer: s.storyText
      }))
    });

    // Update personality profile with results
    const updatedProfile = await prisma.personalityProfile.update({
      where: { id: profile.id },
      data: {
        // OCEAN Scores
        openness: analysisResult.openness,
        conscientiousness: analysisResult.conscientiousness,
        extraversion: analysisResult.extraversion,
        agreeableness: analysisResult.agreeableness,
        neuroticism: analysisResult.neuroticism,

        // Methodology
        confidenceScore: analysisResult.confidenceScore,
        narrativeScores: analysisResult.narrativeScores,
        fusionWeights: analysisResult.fusionWeights,

        // Derived Traits
        workStyle: analysisResult.workStyle,
        communicationStyle: analysisResult.communicationStyle,
        leadershipStyle: analysisResult.leadershipStyle,
        motivationType: analysisResult.motivationType,
        decisionMaking: analysisResult.decisionMaking,

        // Metadata
        isComplete: true,
        profileSummary: analysisResult.profileSummary,
        keyInsights: analysisResult.keyInsights
      }
    });

    // Update user's personalityProfileComplete flag
    await prisma.user.update({
      where: { id: user.id },
      data: { personalityProfileComplete: true }
    });

    console.log('✅ Gold Standard analysis complete!');

    res.json({
      status: 'complete',
      message: 'Gold Standard assessment completed successfully!',
      results: {
        ocean: {
          openness: updatedProfile.openness,
          conscientiousness: updatedProfile.conscientiousness,
          extraversion: updatedProfile.extraversion,
          agreeableness: updatedProfile.agreeableness,
          neuroticism: updatedProfile.neuroticism
        },
        derived: {
          workStyle: updatedProfile.workStyle,
          communicationStyle: updatedProfile.communicationStyle,
          leadershipStyle: updatedProfile.leadershipStyle,
          motivationType: updatedProfile.motivationType,
          decisionMaking: updatedProfile.decisionMaking
        },
        confidence: parseFloat(updatedProfile.confidenceScore),
        summary: updatedProfile.profileSummary,
        insights: updatedProfile.keyInsights
      }
    });

  } catch (error) {
    console.error('Error completing Gold Standard assessment:', error);
    res.status(500).json({
      error: 'Failed to complete assessment',
      details: error.message
    });
  }
});

/**
 * GET /api/gold-standard/status
 * Check assessment progress
 */
router.get('/status', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        personalityProfile: {
          include: {
            stories: {
              select: { questionType: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.personalityProfile) {
      return res.json({
        status: 'not_started',
        message: 'Assessment not yet started'
      });
    }

    const profile = user.personalityProfile;

    if (profile.isComplete) {
      return res.json({
        status: 'complete',
        completedAt: profile.updatedAt
      });
    }

    // Count completed sections
    const storyQuestions = profile.stories.filter(s =>
      ['achievement', 'adversity', 'team', 'innovation', 'helping', 'learning', 'values', 'passion']
        .includes(s.questionType)
    ).length;

    const hybridQuestions = profile.stories.filter(s =>
      ['work_environment', 'project_management', 'stress_response', 'curiosity',
       'conflict_style', 'change_tolerance', 'motivation']
        .includes(s.questionType)
    ).length;

    const likertCompleted = profile.likertScores ? Object.keys(profile.likertScores).length : 0;

    res.json({
      status: 'in_progress',
      progress: {
        stories: { completed: storyQuestions, total: 8 },
        likert: { completed: likertCompleted, total: 20 },
        hybrid: { completed: hybridQuestions, total: 7 }
      },
      overallPercent: Math.round(
        ((storyQuestions / 8) * 40 + (likertCompleted / 20) * 30 + (hybridQuestions / 7) * 30)
      )
    });

  } catch (error) {
    console.error('Error checking assessment status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * POST /api/gold-standard/generate-embeddings
 * Generate embeddings for stories that don't have them
 * (Admin/maintenance endpoint or can be triggered after assessment)
 */
router.post('/generate-embeddings', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all stories without embeddings
    const storiesWithoutEmbeddings = await prisma.$queryRawUnsafe(
      `SELECT id, question_type, question_text, story_text, story_summary
       FROM profile_stories
       WHERE user_id = $1 AND embedding IS NULL`,
      user.id
    );

    if (storiesWithoutEmbeddings.length === 0) {
      return res.json({
        status: 'complete',
        message: 'All stories already have embeddings',
        processed: 0
      });
    }

    console.log(`🔢 Generating embeddings for ${storiesWithoutEmbeddings.length} stories...`);

    let processed = 0;
    const errors = [];

    // Process in batches to avoid rate limits
    for (const story of storiesWithoutEmbeddings) {
      try {
        const embedding = await generateStoryEmbedding({
          questionText: story.question_text,
          storyText: story.story_text,
          storySummary: story.story_summary
        });

        const embeddingStr = formatEmbeddingForPgVector(embedding);

        await prisma.$executeRawUnsafe(
          `UPDATE profile_stories
           SET embedding = $1::vector
           WHERE id = $2`,
          embeddingStr,
          story.id
        );

        processed++;
        console.log(`✅ Embedding generated for story ${story.id.substring(0, 8)} (${processed}/${storiesWithoutEmbeddings.length})`);

        // Rate limiting: wait 100ms between embeddings
        if (processed < storiesWithoutEmbeddings.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Failed to generate embedding for story ${story.id}:`, error);
        errors.push({
          storyId: story.id,
          error: error.message
        });
      }
    }

    res.json({
      status: 'complete',
      message: `Embeddings generated for ${processed} stories`,
      processed,
      total: storiesWithoutEmbeddings.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error generating embeddings:', error);
    res.status(500).json({
      error: 'Failed to generate embeddings',
      details: error.message
    });
  }
});

/**
 * GET /api/gold-standard/results
 * Retrieve completed assessment results
 */
router.get('/results', verifyFirebaseToken, checkGoldAccess, async (req, res) => {
  try {
    const userId = req.user.firebaseUid;

    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        personalityProfile: {
          include: {
            stories: {
              select: {
                questionType: true,
                category: true,
                storySummary: true,
                themes: true,
                skillsDemonstrated: true,
                timesUsedInResumes: true,
                timesUsedInCoverLetters: true
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    if (!user || !user.personalityProfile) {
      return res.status(404).json({ error: 'No assessment found' });
    }

    const profile = user.personalityProfile;

    if (!profile.isComplete) {
      return res.status(400).json({
        error: 'Assessment not yet complete',
        message: 'Please complete the assessment first'
      });
    }

    res.json({
      ocean: {
        openness: profile.openness,
        conscientiousness: profile.conscientiousness,
        extraversion: profile.extraversion,
        agreeableness: profile.agreeableness,
        neuroticism: profile.neuroticism
      },
      derived: {
        workStyle: profile.workStyle,
        communicationStyle: profile.communicationStyle,
        leadershipStyle: profile.leadershipStyle,
        motivationType: profile.motivationType,
        decisionMaking: profile.decisionMaking
      },
      confidence: parseFloat(profile.confidenceScore || 0),
      summary: profile.profileSummary,
      insights: profile.keyInsights,
      stories: profile.stories,
      methodology: {
        version: profile.assessmentVersion,
        likertWeight: 0.7,
        narrativeWeight: 0.3
      },
      completedAt: profile.updatedAt
    });

  } catch (error) {
    console.error('Error retrieving assessment results:', error);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
});

// Helper functions

async function saveStoryAnswers(userId, profileId, answers) {
  // answers is an array of { questionType, questionText, storyText }
  for (const answer of answers) {
    await prisma.profileStory.create({
      data: {
        userId,
        profileId,
        questionType: answer.questionType,
        questionText: answer.questionText,
        storyText: answer.storyText,
        relevanceTags: [answer.questionType]
      }
    });
  }
}

async function saveHybridAnswers(userId, profileId, answers) {
  // answers is an array of { questionType, questionText, answer }
  for (const qa of answers) {
    await prisma.profileStory.create({
      data: {
        userId,
        profileId,
        questionType: qa.questionType,
        questionText: qa.questionText,
        storyText: qa.answer,
        relevanceTags: [qa.questionType, 'hybrid']
      }
    });
  }
}

module.exports = router;
