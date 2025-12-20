/**
 * Embedding Generator - Vertex AI Text Embeddings
 *
 * Generates 768-dimensional vector embeddings for profile stories
 * Uses: text-embedding-004 (Vertex AI)
 *
 * Purpose: Enable semantic search for RAG-powered resume/cover letter generation
 */

const axios = require('axios');
const { getFirebaseAdmin } = require('../config/firebase');

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-004'; // Latest Vertex AI embedding model
const EMBEDDING_DIMENSION = 768;
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'cvstomize';
const LOCATION = 'us-central1';

/**
 * Generate embedding for a single text using Vertex AI REST API
 * @param {string} text - Text to embed (story, question, job description)
 * @returns {Promise<number[]>} 768-dimensional vector
 */
async function generateEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    console.log(`🔢 Generating embedding for text (${text.length} chars)...`);

    // Get access token from Firebase Admin (which has the right credentials)
    const admin = getFirebaseAdmin();
    const accessToken = await admin.credential.applicationDefault().getAccessToken();

    // Call Vertex AI Prediction API
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

    const response = await axios.post(
      url,
      {
        instances: [{ content: text }]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract embedding from response
    const embedding = response.data?.predictions?.[0]?.embeddings?.values;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding?.length}`);
    }

    console.log(`✅ Embedding generated: ${EMBEDDING_DIMENSION} dimensions`);
    return embedding;

  } catch (error) {
    console.error('❌ Embedding generation failed:', error.response?.data || error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @param {number} batchSize - Number of texts per batch (default 5)
 * @returns {Promise<Array<number[]>>} Array of 768-dimensional vectors
 */
async function generateEmbeddingsBatch(texts, batchSize = 5) {
  try {
    if (!texts || texts.length === 0) {
      return [];
    }

    console.log(`🔢 Generating embeddings for ${texts.length} texts (batch size: ${batchSize})...`);

    const embeddings = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}...`);

      // Generate embeddings for batch
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);

      // Rate limiting: wait 100ms between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Batch embedding complete: ${embeddings.length} embeddings generated`);
    return embeddings;

  } catch (error) {
    console.error('❌ Batch embedding generation failed:', error);
    throw error;
  }
}

/**
 * Generate embedding for a profile story
 * Combines question + story text for better context
 * @param {Object} story - Story object with questionText and storyText
 * @returns {Promise<number[]>} 768-dimensional vector
 */
async function generateStoryEmbedding(story) {
  try {
    if (!story || (!story.questionText && !story.storyText && !story.storySummary)) {
      throw new Error('Invalid story object: missing required fields');
    }

    const { questionText, storyText, storySummary } = story;

    // Combine context for richer embedding
    // Priority: summary (if exists) > story > question
    let textToEmbed;

    if (storySummary && storySummary.length > 50) {
      // Use AI-generated summary + original story for best context
      textToEmbed = `${storySummary}\n\nDetails: ${storyText}`;
    } else {
      // Use question + story
      textToEmbed = `${questionText}\n\n${storyText}`;
    }

    // Truncate if too long (max 10,000 chars for embedding model)
    if (textToEmbed.length > 10000) {
      textToEmbed = textToEmbed.substring(0, 10000);
    }

    return await generateEmbedding(textToEmbed);

  } catch (error) {
    console.error('❌ Story embedding generation failed:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vectorA - First embedding vector
 * @param {number[]} vectorB - Second embedding vector
 * @returns {number} Similarity score (0-1, higher = more similar)
 */
function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Format embedding for PostgreSQL pgvector
 * Converts array to pgvector string format: '[1.23, 4.56, ...]'
 * @param {number[]} embedding - Embedding vector
 * @returns {string} Formatted string for pgvector
 */
function formatEmbeddingForPgVector(embedding) {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse pgvector string back to array
 * @param {string} pgvectorString - String from database '[1.23, 4.56, ...]'
 * @returns {number[]} Embedding vector
 */
function parseEmbeddingFromPgVector(pgvectorString) {
  // Remove brackets and split
  const cleaned = pgvectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map(Number);
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateStoryEmbedding,
  cosineSimilarity,
  formatEmbeddingForPgVector,
  parseEmbeddingFromPgVector,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL
};
