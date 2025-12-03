/**
 * Story Retriever - RAG-powered semantic story retrieval
 *
 * Uses pgvector to find most relevant user stories for:
 * - Resume generation (match to job description)
 * - Cover letter generation (match to company values)
 * - Job fit analysis (match to culture keywords)
 *
 * Semantic search: Finds stories by meaning, not just keywords
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateEmbedding, formatEmbeddingForPgVector } = require('./embeddingGenerator');

/**
 * Retrieve most relevant stories for a given query
 * Uses pgvector cosine similarity search
 *
 * @param {string} userId - User ID
 * @param {string} query - Search query (job description, company values, etc.)
 * @param {Object} options - Retrieval options
 * @param {number} options.limit - Number of stories to return (default 5)
 * @param {number} options.minSimilarity - Minimum similarity threshold 0-1 (default 0.5)
 * @param {Array<string>} options.categories - Filter by story categories
 * @param {Array<string>} options.questionTypes - Filter by question types
 * @returns {Promise<Array>} Ranked stories with similarity scores
 */
async function retrieveRelevantStories(userId, query, options = {}) {
  try {
    const {
      limit = 5,
      minSimilarity = 0.5,
      categories = null,
      questionTypes = null
    } = options;

    console.log(`🔍 Retrieving stories for user ${userId.substring(0, 8)}...`);
    console.log(`📝 Query: "${query.substring(0, 100)}..."`);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = formatEmbeddingForPgVector(queryEmbedding);

    // Build SQL query with pgvector similarity search
    let sqlQuery = `
      SELECT
        id,
        question_type,
        question_text,
        story_text,
        story_summary,
        category,
        themes,
        skills_demonstrated,
        personality_signals,
        relevance_tags,
        times_used_in_resumes,
        times_used_in_cover_letters,
        created_at,
        -- Calculate cosine similarity using pgvector <=> operator
        1 - (embedding <=> $1::vector) as similarity
      FROM profile_stories
      WHERE user_id = $2
        AND embedding IS NOT NULL
    `;

    const params = [embeddingStr, userId];
    let paramCount = 2;

    // Filter by categories if provided
    if (categories && categories.length > 0) {
      paramCount++;
      sqlQuery += ` AND category = ANY($${paramCount})`;
      params.push(categories);
    }

    // Filter by question types if provided
    if (questionTypes && questionTypes.length > 0) {
      paramCount++;
      sqlQuery += ` AND question_type = ANY($${paramCount})`;
      params.push(questionTypes);
    }

    // Filter by minimum similarity and order by similarity
    sqlQuery += `
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    console.log(`🔢 Executing similarity search...`);

    // Execute raw SQL query (Prisma doesn't support pgvector operators yet)
    const results = await prisma.$queryRawUnsafe(sqlQuery, ...params);

    // Filter by minimum similarity threshold
    const filteredResults = results.filter(story => story.similarity >= minSimilarity);

    console.log(`✅ Found ${filteredResults.length} relevant stories (min similarity: ${minSimilarity})`);

    // Log top matches for debugging
    if (filteredResults.length > 0) {
      console.log(`📊 Top matches:`);
      filteredResults.slice(0, 3).forEach((story, i) => {
        console.log(`  ${i + 1}. ${story.question_type} (${(story.similarity * 100).toFixed(1)}% match)`);
      });
    }

    return filteredResults.map(story => ({
      id: story.id,
      questionType: story.question_type,
      questionText: story.question_text,
      storyText: story.story_text,
      storySummary: story.story_summary,
      category: story.category,
      themes: story.themes,
      skillsDemonstrated: story.skills_demonstrated,
      personalitySignals: story.personality_signals,
      relevanceTags: story.relevance_tags,
      similarity: parseFloat(story.similarity),
      usageCount: {
        resumes: story.times_used_in_resumes,
        coverLetters: story.times_used_in_cover_letters
      },
      createdAt: story.created_at
    }));

  } catch (error) {
    console.error('❌ Story retrieval failed:', error);
    throw new Error(`Failed to retrieve stories: ${error.message}`);
  }
}

/**
 * Retrieve stories for resume generation
 * Focuses on stories matching job requirements and skills
 *
 * @param {string} userId - User ID
 * @param {string} jobDescription - Job description text
 * @param {number} count - Number of stories to retrieve (default 5)
 * @returns {Promise<Array>} Top matching stories
 */
async function retrieveStoriesForResume(userId, jobDescription, count = 5) {
  try {
    console.log(`📄 Retrieving stories for resume generation...`);

    // Prioritize achievement, innovation, and team stories
    const preferredTypes = [
      'achievement',
      'innovation',
      'team',
      'learning',
      'leadership'
    ];

    const stories = await retrieveRelevantStories(userId, jobDescription, {
      limit: count * 2, // Get more to filter
      minSimilarity: 0.4, // Lower threshold for resumes
      questionTypes: preferredTypes
    });

    // Take top N stories
    return stories.slice(0, count);

  } catch (error) {
    console.error('❌ Resume story retrieval failed:', error);
    return []; // Return empty array on failure (graceful degradation)
  }
}

/**
 * Retrieve stories for cover letter generation
 * Focuses on stories matching company values and culture
 *
 * @param {string} userId - User ID
 * @param {string} companyInfo - Company description, mission, values
 * @param {number} count - Number of stories to retrieve (default 3)
 * @returns {Promise<Array>} Top matching stories
 */
async function retrieveStoriesForCoverLetter(userId, companyInfo, count = 3) {
  try {
    console.log(`✉️ Retrieving stories for cover letter generation...`);

    // Prioritize passion, values, and helping stories for cover letters
    const preferredTypes = [
      'passion',
      'values',
      'helping',
      'achievement',
      'innovation'
    ];

    const stories = await retrieveRelevantStories(userId, companyInfo, {
      limit: count * 2,
      minSimilarity: 0.5, // Higher threshold for cover letters (more selective)
      questionTypes: preferredTypes
    });

    return stories.slice(0, count);

  } catch (error) {
    console.error('❌ Cover letter story retrieval failed:', error);
    return [];
  }
}

/**
 * Update story usage count after using in resume/cover letter
 * @param {string} storyId - Story ID
 * @param {string} usageType - 'resume' | 'coverLetter'
 */
async function incrementStoryUsage(storyId, usageType) {
  try {
    const updateData = {
      lastUsedAt: new Date()
    };

    if (usageType === 'resume') {
      await prisma.profileStory.update({
        where: { id: storyId },
        data: {
          ...updateData,
          timesUsedInResumes: { increment: 1 }
        }
      });
    } else if (usageType === 'coverLetter') {
      await prisma.profileStory.update({
        where: { id: storyId },
        data: {
          ...updateData,
          timesUsedInCoverLetters: { increment: 1 }
        }
      });
    }

    console.log(`📊 Updated usage count for story ${storyId.substring(0, 8)} (${usageType})`);

  } catch (error) {
    console.error('❌ Failed to update story usage:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Get story usage analytics for a user
 * Shows which stories are most/least used
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage statistics
 */
async function getStoryUsageAnalytics(userId) {
  try {
    const stories = await prisma.profileStory.findMany({
      where: { userId },
      select: {
        id: true,
        questionType: true,
        category: true,
        timesUsedInResumes: true,
        timesUsedInCoverLetters: true,
        lastUsedAt: true
      },
      orderBy: [
        { timesUsedInResumes: 'desc' },
        { timesUsedInCoverLetters: 'desc' }
      ]
    });

    const totalUsage = stories.reduce((sum, s) =>
      sum + s.timesUsedInResumes + s.timesUsedInCoverLetters, 0
    );

    const mostUsed = stories.slice(0, 5);
    const leastUsed = stories.filter(s =>
      s.timesUsedInResumes === 0 && s.timesUsedInCoverLetters === 0
    );

    return {
      totalStories: stories.length,
      totalUsage,
      averageUsage: stories.length > 0 ? totalUsage / stories.length : 0,
      mostUsed: mostUsed.map(s => ({
        id: s.id,
        type: s.questionType,
        category: s.category,
        resumes: s.timesUsedInResumes,
        coverLetters: s.timesUsedInCoverLetters,
        total: s.timesUsedInResumes + s.timesUsedInCoverLetters
      })),
      underutilized: leastUsed.map(s => ({
        id: s.id,
        type: s.questionType,
        category: s.category
      }))
    };

  } catch (error) {
    console.error('❌ Failed to get story analytics:', error);
    throw error;
  }
}

module.exports = {
  retrieveRelevantStories,
  retrieveStoriesForResume,
  retrieveStoriesForCoverLetter,
  incrementStoryUsage,
  getStoryUsageAnalytics
};
