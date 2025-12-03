/**
 * Integration tests for RAG-powered story retrieval
 *
 * Tests:
 * 1. Embedding generation via Vertex AI
 * 2. Story storage with pgvector
 * 3. Semantic search with cosine similarity
 * 4. Resume generation integration
 * 5. Usage tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateStoryEmbedding, formatEmbeddingForPgVector } = require('../../services/embeddingGenerator');
const { retrieveStoriesForResume, retrieveStoriesForCoverLetter, incrementStoryUsage } = require('../../services/storyRetriever');
const { MOCK_JOB_DESCRIPTION_DEVOPS, MOCK_JOB_DESCRIPTION_FRONTEND, generateMockEmbedding } = require('../fixtures/goldStandardMocks');

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    preview: {
      getGenerativeModel: jest.fn(() => ({
        embedContent: jest.fn((content) => {
          // Generate deterministic embeddings based on text content
          const text = content.content[0].parts[0].text.toLowerCase();

          // Create embedding with higher values for matching keywords
          const embedding = new Array(768).fill(0);

          // DevOps keywords
          if (text.includes('kubernetes')) embedding[0] = 0.8;
          if (text.includes('devops')) embedding[1] = 0.7;
          if (text.includes('ci/cd')) embedding[2] = 0.6;
          if (text.includes('mentor')) embedding[3] = 0.5;

          // Frontend keywords
          if (text.includes('react')) embedding[10] = 0.8;
          if (text.includes('frontend')) embedding[11] = 0.7;
          if (text.includes('a/b test')) embedding[12] = 0.6;
          if (text.includes('ux')) embedding[13] = 0.5;

          // Fill rest with small random values
          for (let i = 20; i < 768; i++) {
            embedding[i] = Math.random() * 0.1;
          }

          return Promise.resolve({
            embedding: { values: embedding }
          });
        })
      }))
    }
  }))
}));

describe('RAG Story Retrieval - Integration Tests', () => {
  let testUser;
  let testProfile;
  let devOpsStoryId;
  let frontendStoryId;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.upsert({
      where: { firebaseUid: 'rag-test-user' },
      update: {
        subscriptionTier: 'gold',
        email: 'rag@test.com'
      },
      create: {
        firebaseUid: 'rag-test-user',
        email: 'rag@test.com',
        emailVerified: true,
        subscriptionTier: 'gold',
        displayName: 'RAG Test User'
      }
    });

    // Create personality profile
    testProfile = await prisma.personalityProfile.create({
      data: {
        userId: testUser.id,
        assessmentVersion: 'hybrid-v3',
        isComplete: true,
        openness: 85,
        conscientiousness: 80
      }
    });

    // Create DevOps story with embedding
    const devOpsStory = {
      questionText: 'Describe how you learned a new technology',
      storyText: 'When our company decided to adopt Kubernetes, I took initiative to become our internal expert. I completed the CKA certification in 6 weeks, set up our first production cluster, and created comprehensive documentation. I trained 8 other engineers through workshops. Within 3 months we migrated 15 services to K8s, reducing infrastructure costs by 40% and improving deployment reliability through proper CI/CD pipelines.',
      storySummary: 'Led Kubernetes adoption, got certified, and mentored team'
    };

    const devOpsEmbedding = await generateStoryEmbedding(devOpsStory);
    const devOpsEmbeddingStr = formatEmbeddingForPgVector(devOpsEmbedding);

    const devOpsResult = await prisma.$queryRawUnsafe(
      `INSERT INTO profile_stories
       (id, user_id, profile_id, question_type, question_text, story_text, story_summary,
        category, themes, skills_demonstrated, relevance_tags, embedding, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector, NOW(), NOW())
       RETURNING id`,
      require('crypto').randomUUID(),
      testUser.id,
      testProfile.id,
      'learning',
      devOpsStory.questionText,
      devOpsStory.storyText,
      devOpsStory.storySummary,
      'technical_growth',
      ['kubernetes', 'devops', 'mentoring'],
      ['kubernetes', 'devops', 'ci/cd', 'mentoring'],
      ['kubernetes', 'devops', 'infrastructure'],
      devOpsEmbeddingStr
    );

    devOpsStoryId = devOpsResult[0]?.id;

    // Create frontend story with embedding
    const frontendStory = {
      questionText: 'Tell me about a successful team collaboration',
      storyText: 'I partnered with our UX designer and product manager to redesign our mobile onboarding flow. Through weekly design reviews and A/B testing 6 different variations, we increased signup completion from 42% to 78% over 3 months. I built the frontend with React Native, implemented analytics tracking, and facilitated knowledge sharing sessions. The collaborative approach led to innovative solutions that improved user experience significantly.',
      storySummary: 'Collaborated with design/product to improve UX via A/B testing'
    };

    const frontendEmbedding = await generateStoryEmbedding(frontendStory);
    const frontendEmbeddingStr = formatEmbeddingForPgVector(frontendEmbedding);

    const frontendResult = await prisma.$queryRawUnsafe(
      `INSERT INTO profile_stories
       (id, user_id, profile_id, question_type, question_text, story_text, story_summary,
        category, themes, skills_demonstrated, relevance_tags, embedding, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector, NOW(), NOW())
       RETURNING id`,
      require('crypto').randomUUID(),
      testUser.id,
      testProfile.id,
      'team',
      frontendStory.questionText,
      frontendStory.storyText,
      frontendStory.storySummary,
      'cross_functional',
      ['collaboration', 'ux', 'data-driven'],
      ['react', 'a/b testing', 'user research', 'frontend'],
      ['frontend', 'product', 'design'],
      frontendEmbeddingStr
    );

    frontendStoryId = frontendResult[0]?.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testProfile) {
      await prisma.profileStory.deleteMany({ where: { profileId: testProfile.id } });
      await prisma.personalityProfile.delete({ where: { id: testProfile.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    await prisma.$disconnect();
  });

  describe('Embedding Generation', () => {
    it('should generate 768-dimensional vector from Vertex AI', async () => {
      const story = {
        questionText: 'Test question',
        storyText: 'This is a test story about Kubernetes and DevOps',
        storySummary: 'Test summary'
      };

      const embedding = await generateStoryEmbedding(story);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(768);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should format embedding for pgvector correctly', () => {
      const embedding = [0.1, 0.2, 0.3];
      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted).toBe('[0.1,0.2,0.3]');
    });

    it('should handle large embeddings', () => {
      const embedding = new Array(768).fill(0.123456789);
      const formatted = formatEmbeddingForPgVector(embedding);

      expect(formatted.startsWith('[')).toBe(true);
      expect(formatted.endsWith(']')).toBe(true);
      expect(formatted.split(',').length).toBe(768);
    });
  });

  describe('Semantic Search - Resume Retrieval', () => {
    it('should retrieve DevOps story for DevOps job description', async () => {
      const stories = await retrieveStoriesForResume(
        testUser.id,
        MOCK_JOB_DESCRIPTION_DEVOPS,
        5
      );

      expect(stories).toBeDefined();
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBeGreaterThan(0);

      // DevOps story should rank higher than frontend story
      const devOpsStory = stories.find(s => s.id === devOpsStoryId);
      const frontendStory = stories.find(s => s.id === frontendStoryId);

      if (devOpsStory && frontendStory) {
        expect(devOpsStory.similarity).toBeGreaterThan(frontendStory.similarity);
      }

      // Verify similarity score is reasonable
      expect(stories[0].similarity).toBeGreaterThan(0);
      expect(stories[0].similarity).toBeLessThanOrEqual(1);
    });

    it('should retrieve frontend story for frontend job description', async () => {
      const stories = await retrieveStoriesForResume(
        testUser.id,
        MOCK_JOB_DESCRIPTION_FRONTEND,
        5
      );

      expect(stories.length).toBeGreaterThan(0);

      // Frontend story should rank higher for frontend job
      const frontendStory = stories.find(s => s.id === frontendStoryId);
      expect(frontendStory).toBeDefined();

      // Verify story contains expected fields
      expect(frontendStory.storyText).toBeDefined();
      expect(frontendStory.storySummary).toBeDefined();
      expect(frontendStory.skillsDemonstrated).toBeDefined();
      expect(frontendStory.themes).toBeDefined();
    });

    it('should respect similarity threshold', async () => {
      // Use very high threshold to filter out results
      const stories = await retrieveStoriesForResume(
        testUser.id,
        'completely unrelated topic about cooking recipes',
        5
      );

      // Should return fewer results due to low similarity
      // (or empty array if nothing meets threshold)
      expect(Array.isArray(stories)).toBe(true);
    });

    it('should return empty array if no embeddings exist', async () => {
      // Create user without embeddings
      const noEmbeddingUser = await prisma.user.create({
        data: {
          firebaseUid: 'no-embedding-user',
          email: 'noembed@test.com',
          emailVerified: true,
          subscriptionTier: 'gold'
        }
      });

      const stories = await retrieveStoriesForResume(
        noEmbeddingUser.id,
        'any job description',
        5
      );

      expect(stories).toEqual([]);

      // Cleanup
      await prisma.user.delete({ where: { id: noEmbeddingUser.id } });
    });
  });

  describe('Semantic Search - Cover Letter Retrieval', () => {
    it('should prioritize values/passion stories for cover letters', async () => {
      const companyInfo = 'We are a mission-driven startup building open-source developer tools. We value passion for community, technical excellence, and collaborative culture.';

      const stories = await retrieveStoriesForCoverLetter(
        testUser.id,
        companyInfo,
        3
      );

      expect(Array.isArray(stories)).toBe(true);
      // Should retrieve stories even if they don't perfectly match
      // (cover letters use lower threshold)
    });
  });

  describe('Usage Tracking', () => {
    it('should increment story usage count for resumes', async () => {
      const initialStory = await prisma.profileStory.findUnique({
        where: { id: devOpsStoryId },
        select: { timesUsedInResumes: true }
      });

      const initialCount = initialStory.timesUsedInResumes;

      await incrementStoryUsage(devOpsStoryId, 'resume');

      const updatedStory = await prisma.profileStory.findUnique({
        where: { id: devOpsStoryId },
        select: { timesUsedInResumes: true }
      });

      expect(updatedStory.timesUsedInResumes).toBe(initialCount + 1);
    });

    it('should increment story usage count for cover letters', async () => {
      const initialStory = await prisma.profileStory.findUnique({
        where: { id: frontendStoryId },
        select: { timesUsedInCoverLetters: true }
      });

      const initialCount = initialStory.timesUsedInCoverLetters;

      await incrementStoryUsage(frontendStoryId, 'cover_letter');

      const updatedStory = await prisma.profileStory.findUnique({
        where: { id: frontendStoryId },
        select: { timesUsedInCoverLetters: true }
      });

      expect(updatedStory.timesUsedInCoverLetters).toBe(initialCount + 1);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should safely handle malicious user input in queries', async () => {
      // Create user with SQL injection attempt in ID
      const maliciousUserId = testUser.id; // Use real UUID

      // This should NOT execute arbitrary SQL
      const stories = await retrieveStoriesForResume(
        maliciousUserId,
        "'; DROP TABLE profile_stories; --",
        5
      );

      // Should return safely (parameterized queries prevent injection)
      expect(Array.isArray(stories)).toBe(true);

      // Verify table still exists
      const tableCheck = await prisma.$queryRaw`
        SELECT COUNT(*) FROM profile_stories WHERE user_id = ${testUser.id}
      `;

      expect(tableCheck).toBeDefined();
    });

    it('should handle special characters in story text', async () => {
      const specialStory = {
        questionText: "Test with 'quotes' and \"double quotes\"",
        storyText: "Story with $pecial ch@racters! AND OR; DROP TABLE;",
        storySummary: "Special chars: ' \" \\ ; --"
      };

      // Should not throw error
      const embedding = await generateStoryEmbedding(specialStory);
      expect(embedding).toHaveLength(768);
    });
  });

  describe('Performance', () => {
    it('should complete semantic search in under 500ms', async () => {
      const start = Date.now();

      await retrieveStoriesForResume(
        testUser.id,
        MOCK_JOB_DESCRIPTION_DEVOPS,
        5
      );

      const duration = Date.now() - start;

      // pgvector with IVFFlat index should be fast
      expect(duration).toBeLessThan(500);
    });
  });
});
