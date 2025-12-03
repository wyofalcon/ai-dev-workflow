/**
 * Integration tests for Gold Standard Personality Assessment
 *
 * Tests the complete flow:
 * 1. Start assessment
 * 2. Submit story, Likert, and hybrid answers
 * 3. Complete assessment (triggers analysis + embedding generation)
 * 4. Verify OCEAN scores, embeddings, and database updates
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: () => ({
    verifyIdToken: jest.fn((token) => {
      if (token === 'valid-gold-token') {
        return Promise.resolve({ uid: 'test-gold-user' });
      }
      if (token === 'valid-free-token') {
        return Promise.resolve({ uid: 'test-free-user' });
      }
      return Promise.reject(new Error('Invalid token'));
    })
  })
}));

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    preview: {
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn((prompt) => {
          // Mock Gemini Flash response for story extraction
          if (prompt.includes('STORY ANALYSIS')) {
            return Promise.resolve({
              response: {
                candidates: [{
                  content: {
                    parts: [{
                      text: JSON.stringify({
                        story_summary: 'Led team to launch collaboration platform',
                        category: 'technical_leadership',
                        themes: ['leadership', 'architecture', 'mentoring'],
                        skills_demonstrated: ['kubernetes', 'ci/cd', 'team leadership'],
                        personality_signals: {
                          openness: 85,
                          conscientiousness: 90,
                          extraversion: 70
                        },
                        relevance_tags: ['engineering', 'leadership']
                      })
                    }]
                  }
                }]
              }
            });
          }

          // Mock Gemini Flash response for NLP personality analysis
          if (prompt.includes('NARRATIVE PERSONALITY ANALYSIS')) {
            return Promise.resolve({
              response: {
                candidates: [{
                  content: {
                    parts: [{
                      text: JSON.stringify({
                        openness: 82,
                        conscientiousness: 85,
                        extraversion: 65,
                        agreeableness: 75,
                        neuroticism: 28,
                        confidence: 0.88,
                        reasoning: 'Strong innovation and learning signals'
                      })
                    }]
                  }
                }],
                usageMetadata: { totalTokenCount: 1500 }
              }
            });
          }

          return Promise.resolve({
            response: {
              candidates: [{ content: { parts: [{ text: '{}' }] } }]
            }
          });
        }),
        embedContent: jest.fn(() => {
          // Mock embedding generation (768-dim vector)
          const mockEmbedding = Array.from({ length: 768 }, () => Math.random() * 0.2 - 0.1);
          return Promise.resolve({
            embedding: { values: mockEmbedding }
          });
        })
      }))
    }
  }))
}));

const {
  MOCK_STORIES,
  MOCK_LIKERT_HIGH_OPENNESS,
  MOCK_HYBRID_ANSWERS,
  EXPECTED_HIGH_OPENNESS_SCORES
} = require('../fixtures/goldStandardMocks');

// Lazy load app after mocks are set up
let app;

describe('Gold Standard Personality Assessment - Integration Tests', () => {
  let testGoldUser;
  let testFreeUser;

  beforeAll(async () => {
    // Load app after mocks
    app = require('../../index').app;

    // Create test users
    testGoldUser = await prisma.user.upsert({
      where: { firebaseUid: 'test-gold-user' },
      update: {
        subscriptionTier: 'gold',
        email: 'gold@test.com',
        displayName: 'Gold Test User'
      },
      create: {
        firebaseUid: 'test-gold-user',
        email: 'gold@test.com',
        emailVerified: true,
        subscriptionTier: 'gold',
        displayName: 'Gold Test User'
      }
    });

    testFreeUser = await prisma.user.upsert({
      where: { firebaseUid: 'test-free-user' },
      update: {
        subscriptionTier: 'free',
        email: 'free@test.com'
      },
      create: {
        firebaseUid: 'test-free-user',
        email: 'free@test.com',
        emailVerified: true,
        subscriptionTier: 'free',
        displayName: 'Free Test User'
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testGoldUser) {
      await prisma.profileStory.deleteMany({ where: { userId: testGoldUser.id } });
      await prisma.personalityProfile.deleteMany({ where: { userId: testGoldUser.id } });
    }

    await prisma.$disconnect();
  });

  describe('POST /api/gold-standard/start', () => {
    it('should create personality profile for Gold tier user', async () => {
      const res = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      expect(res.body.status).toBe('started');
      expect(res.body.profileId).toBeDefined();
      expect(res.body.sections).toEqual({
        stories: { total: 8, completed: 0 },
        likert: { total: 20, completed: 0 },
        hybrid: { total: 7, completed: 0 }
      });

      // Verify profile created in database
      const profile = await prisma.personalityProfile.findUnique({
        where: { id: res.body.profileId }
      });

      expect(profile).toBeTruthy();
      expect(profile.userId).toBe(testGoldUser.id);
      expect(profile.assessmentVersion).toBe('hybrid-v3');
      expect(profile.isComplete).toBe(false);
    });

    it('should reject Free tier user with 403', async () => {
      const res = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-free-token')
        .expect(403);

      expect(res.body.error).toContain('Gold Standard access required');
      expect(res.body.upgradeUrl).toBe('/upgrade');
    });

    it('should return existing profile if already complete', async () => {
      // Create completed profile
      const existingProfile = await prisma.personalityProfile.create({
        data: {
          userId: testGoldUser.id,
          assessmentVersion: 'hybrid-v3',
          isComplete: true,
          openness: 85,
          conscientiousness: 80
        }
      });

      const res = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      expect(res.body.status).toBe('already_complete');
      expect(res.body.profile.id).toBe(existingProfile.id);

      // Cleanup
      await prisma.personalityProfile.delete({ where: { id: existingProfile.id } });
    });
  });

  describe('POST /api/gold-standard/answer', () => {
    let profileId;

    beforeEach(async () => {
      // Start fresh assessment
      const startRes = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token');

      profileId = startRes.body.profileId;
    });

    it('should save story answers', async () => {
      const res = await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'stories',
          answers: MOCK_STORIES
        })
        .expect(200);

      expect(res.body.status).toBe('saved');
      expect(res.body.section).toBe('stories');

      // Verify stories in database
      const stories = await prisma.profileStory.findMany({
        where: { profileId }
      });

      expect(stories).toHaveLength(8);
      expect(stories[0].questionType).toBe('achievement');
      expect(stories[0].storyText).toContain('cross-functional team');
    });

    it('should save Likert responses', async () => {
      const res = await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'likert',
          answers: MOCK_LIKERT_HIGH_OPENNESS
        })
        .expect(200);

      expect(res.body.status).toBe('saved');

      // Verify Likert scores in database
      const profile = await prisma.personalityProfile.findUnique({
        where: { id: profileId }
      });

      expect(profile.likertScores).toEqual(MOCK_LIKERT_HIGH_OPENNESS);
    });

    it('should save hybrid answers', async () => {
      const res = await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'hybrid',
          answers: MOCK_HYBRID_ANSWERS
        })
        .expect(200);

      expect(res.body.status).toBe('saved');

      // Verify hybrid answers in database
      const hybridStories = await prisma.profileStory.findMany({
        where: {
          profileId,
          questionType: { in: ['work_environment', 'project_management', 'stress_response', 'curiosity', 'conflict_style', 'change_tolerance', 'motivation'] }
        }
      });

      expect(hybridStories).toHaveLength(7);
    });
  });

  describe('POST /api/gold-standard/complete - CRITICAL PATH', () => {
    it('should perform hybrid personality analysis and create embeddings', async () => {
      // Step 1: Start assessment
      const startRes = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      const { profileId } = startRes.body;

      // Step 2: Submit stories
      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'stories',
          answers: MOCK_STORIES
        })
        .expect(200);

      // Step 3: Submit Likert responses
      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'likert',
          answers: MOCK_LIKERT_HIGH_OPENNESS
        })
        .expect(200);

      // Step 4: Submit hybrid answers
      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'hybrid',
          answers: MOCK_HYBRID_ANSWERS
        })
        .expect(200);

      // Step 5: Complete assessment
      const completeRes = await request(app)
        .post('/api/gold-standard/complete')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      // Assertions: Verify response structure
      expect(completeRes.body.status).toBe('complete');
      expect(completeRes.body.results).toBeDefined();
      expect(completeRes.body.results.ocean).toBeDefined();
      expect(completeRes.body.results.derived).toBeDefined();

      // Verify OCEAN scores are in expected ranges
      const { ocean } = completeRes.body.results;

      expect(ocean.openness).toBeGreaterThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.openness.min);
      expect(ocean.openness).toBeLessThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.openness.max);

      expect(ocean.conscientiousness).toBeGreaterThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.conscientiousness.min);
      expect(ocean.conscientiousness).toBeLessThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.conscientiousness.max);

      expect(ocean.neuroticism).toBeGreaterThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.neuroticism.min);
      expect(ocean.neuroticism).toBeLessThanOrEqual(EXPECTED_HIGH_OPENNESS_SCORES.neuroticism.max);

      // Verify confidence score
      expect(completeRes.body.results.confidence).toBeGreaterThan(0.7);
      expect(completeRes.body.results.confidence).toBeLessThanOrEqual(1.0);

      // Verify derived traits
      expect(completeRes.body.results.derived.workStyle).toBeDefined();
      expect(completeRes.body.results.derived.communicationStyle).toBeDefined();
      expect(completeRes.body.results.derived.leadershipStyle).toBeDefined();

      // Verify database: Profile updated
      const profile = await prisma.personalityProfile.findUnique({
        where: { id: profileId }
      });

      expect(profile.isComplete).toBe(true);
      expect(profile.openness).toBe(ocean.openness);
      expect(profile.conscientiousness).toBe(ocean.conscientiousness);

      // Verify database: Stories have embeddings
      const storiesWithEmbeddings = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count
         FROM profile_stories
         WHERE profile_id = $1 AND embedding IS NOT NULL`,
        profileId
      );

      expect(parseInt(storiesWithEmbeddings[0].count)).toBeGreaterThan(0);

      // Verify database: User flag updated
      const user = await prisma.user.findUnique({
        where: { id: testGoldUser.id }
      });

      expect(user.personalityProfileComplete).toBe(true);
    }, 30000); // 30 second timeout for full flow

    it('should reject incomplete assessment', async () => {
      // Start assessment but don't complete all sections
      const startRes = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token');

      // Only submit stories (missing Likert and hybrid)
      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'stories',
          answers: MOCK_STORIES
        });

      // Try to complete
      const completeRes = await request(app)
        .post('/api/gold-standard/complete')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(400);

      expect(completeRes.body.error).toContain('Likert section not completed');
    });
  });

  describe('GET /api/gold-standard/status', () => {
    it('should return assessment progress', async () => {
      // Start and partially complete assessment
      await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token');

      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({
          section: 'stories',
          answers: MOCK_STORIES.slice(0, 5) // Only 5 of 8 stories
        });

      const statusRes = await request(app)
        .get('/api/gold-standard/status')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      expect(statusRes.body.status).toBe('in_progress');
      expect(statusRes.body.progress.stories.completed).toBe(5);
      expect(statusRes.body.progress.stories.total).toBe(8);
    });
  });

  describe('GET /api/gold-standard/results', () => {
    it('should return completed assessment results', async () => {
      // Complete full assessment first
      const startRes = await request(app)
        .post('/api/gold-standard/start')
        .set('Authorization', 'Bearer valid-gold-token');

      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({ section: 'stories', answers: MOCK_STORIES });

      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({ section: 'likert', answers: MOCK_LIKERT_HIGH_OPENNESS });

      await request(app)
        .post('/api/gold-standard/answer')
        .set('Authorization', 'Bearer valid-gold-token')
        .send({ section: 'hybrid', answers: MOCK_HYBRID_ANSWERS });

      await request(app)
        .post('/api/gold-standard/complete')
        .set('Authorization', 'Bearer valid-gold-token');

      // Now get results
      const resultsRes = await request(app)
        .get('/api/gold-standard/results')
        .set('Authorization', 'Bearer valid-gold-token')
        .expect(200);

      expect(resultsRes.body.ocean).toBeDefined();
      expect(resultsRes.body.derived).toBeDefined();
      expect(resultsRes.body.stories).toBeDefined();
      expect(resultsRes.body.methodology.version).toBe('hybrid-v3');
    }, 30000);
  });
});
