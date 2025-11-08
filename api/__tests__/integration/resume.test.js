// Set environment BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock data
const mockUser = {
  id: 'user-123',
  firebaseUid: 'test-uid-123',
  email: 'test@example.com',
  resumesGenerated: 0,
  resumesLimit: 1,
  subscriptionTier: 'free',
};

const mockResume = {
  id: 'resume-123',
  userId: 'user-123',
  title: 'Tailored Resume',
  targetCompany: 'Google',
  jobDescription: 'Software Engineer role...',
  resumeMarkdown: '# John Doe\n\n## Experience\n...',
  modelUsed: 'gemini-2.5-pro',
  tokensUsed: 1500,
  generationTimeMs: 3000,
  costUsd: 0.001875,
  status: 'generated',
  createdAt: new Date(),
};

const mockPersonality = {
  id: 'personality-123',
  userId: 'user-123',
  openness: 75,
  conscientiousness: 80,
  extraversion: 60,
  agreeableness: 70,
  neuroticism: 40,
  workStyle: 'collaborative',
  communicationStyle: 'analytical',
};

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  resume: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  personalityTraits: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('../config/database', () => mockPrismaClient);

// Mock Gemini Service
const mockGeminiResponse = {
  response: {
    candidates: [{
      content: {
        parts: [{ text: '# John Doe\n\nSoftware Engineer\n\n## Experience\n- 5 years at Tech Co' }]
      }
    }],
    usageMetadata: { totalTokenCount: 1500 }
  }
};

jest.mock('../services/geminiServiceVertex', () => ({
  getProModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue(mockGeminiResponse)
  }))
}));

// Mock Personality Inference
jest.mock('../services/personalityInference', () => ({
  inferPersonality: jest.fn(() => ({
    openness: 75,
    conscientiousness: 80,
    extraversion: 60,
    agreeableness: 70,
    neuroticism: 40,
    workStyle: 'collaborative',
    leadershipStyle: 'democratic',
    communicationStyle: 'analytical',
    motivationType: 'achievement',
    decisionMaking: 'analytical',
    inferenceConfidence: 0.7,
    analysisVersion: '1.0',
  }))
}));

// Use global Firebase mock from setup.js (no need to mock again)
const request = require('supertest');
const { app } = require('../../index');

describe('Resume API Endpoints', () => {
  let validToken;
  let mockFirebaseUser;

  beforeAll(() => {
    mockFirebaseUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      firebase: {
        sign_in_provider: 'google.com',
      },
    };

    validToken = 'mock-firebase-token-12345';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reconfigure Firebase mock after clearing
    global.mockVerifyIdToken.mockResolvedValue(mockFirebaseUser);
  });

  describe('POST /api/resume/generate', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/resume/generate')
        .send({
          jobDescription: 'Software Engineer',
          selectedSections: ['Experience', 'Education']
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if job description missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          selectedSections: ['Experience']
        })
        .expect(400);

      expect(response.body.error).toContain('Job description');
    });

    it('should return 400 if no sections selected', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          jobDescription: 'Software Engineer role'
        })
        .expect(400);

      expect(response.body.error).toContain('sections required');
    });

    it('should return 403 if resume limit reached', async () => {
      const userAtLimit = { ...mockUser, resumesGenerated: 1, resumesLimit: 1 };
      mockPrismaClient.user.findUnique.mockResolvedValue(userAtLimit);

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          jobDescription: 'Software Engineer',
          selectedSections: ['Experience'],
          resumeText: 'My resume text'
        })
        .expect(403);

      expect(response.body.error).toBe('Resume limit reached');
      expect(response.body.message).toContain('1/1');
    });

    it('should generate resume successfully without personality', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.personalityTraits.findUnique.mockResolvedValue(null);
      mockPrismaClient.resume.create.mockResolvedValue(mockResume);
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, resumesGenerated: 1 });

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          resumeText: 'My work experience...',
          jobDescription: 'Software Engineer at Google',
          selectedSections: ['Experience', 'Education', 'Skills']
        });

      // Debug: Log actual response if not 201
      if (response.status !== 201) {
        console.log('❌ Test failed with status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.resume).toHaveProperty('id');
      expect(response.body.resume).toHaveProperty('markdown');
      expect(response.body.usage.resumesGenerated).toBe(1);
      expect(response.body.usage.remaining).toBe(0);
      expect(response.body.metadata.personalityUsed).toBe(false);

      // Verify resume was saved
      expect(mockPrismaClient.resume.create).toHaveBeenCalled();
      // Verify counter incremented
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          resumesGenerated: { increment: 1 }
        })
      });
    });

    it('should generate resume with personality inference from stories', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.personalityTraits.findUnique.mockResolvedValue(null);
      mockPrismaClient.personalityTraits.create.mockResolvedValue(mockPersonality);
      mockPrismaClient.resume.create.mockResolvedValue(mockResume);
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, resumesGenerated: 1 });

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          personalStories: 'I led a team to build an innovative app...',
          jobDescription: 'Senior Software Engineer',
          selectedSections: ['Experience'],
          targetCompany: 'Google'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.personalityUsed).toBe(true);

      // Verify personality was created (API doesn't return personality in response)
      expect(mockPrismaClient.personalityTraits.create).toHaveBeenCalled();
    });

    it('should use existing personality traits if available', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.personalityTraits.findUnique.mockResolvedValue(mockPersonality);
      mockPrismaClient.resume.create.mockResolvedValue(mockResume);
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, resumesGenerated: 1 });

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          resumeText: 'Experience...',
          jobDescription: 'PM role',
          selectedSections: ['Experience']
        })
        .expect(201);

      expect(response.body.metadata.personalityUsed).toBe(true);

      // Should NOT create new personality (used existing)
      expect(mockPrismaClient.personalityTraits.create).not.toHaveBeenCalled();
    });

    it('should track token usage and cost correctly', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.personalityTraits.findUnique.mockResolvedValue(null);
      mockPrismaClient.resume.create.mockResolvedValue(mockResume);
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/generate')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          resumeText: 'Test',
          jobDescription: 'Test',
          selectedSections: ['Experience']
        })
        .expect(201);

      // Verify cost calculation
      const createCall = mockPrismaClient.resume.create.mock.calls[0][0];
      expect(createCall.data.tokensUsed).toBe(1500);
      expect(createCall.data.costUsd).toBeCloseTo(0.001875, 6); // $1.25 per 1M tokens
      expect(createCall.data.modelUsed).toBe('gemini-2.5-pro');
    });
  });

  describe('GET /api/resume/list', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/resume/list')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return empty list for new user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.resume.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/resume/list')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.resumes).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return user resumes list', async () => {
      const resumes = [mockResume, { ...mockResume, id: 'resume-124' }];
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.resume.findMany.mockResolvedValue(resumes);

      const response = await request(app)
        .get('/api/resume/list')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.resumes).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.resumes[0]).toHaveProperty('title');
      expect(response.body.resumes[0]).toHaveProperty('createdAt');
    });
  });

  describe('GET /api/resume/:id', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/resume/resume-123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 404 if resume not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.resume.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/resume/nonexistent')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.error).toContain('Not Found');
    });

    it('should return resume details', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.resume.findFirst.mockResolvedValue(mockResume);

      const response = await request(app)
        .get('/api/resume/resume-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.resume).toHaveProperty('id');
      expect(response.body.resume.title).toBe('Tailored Resume');
    });
  });

  describe('GET /api/resume/:id/download', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/resume/resume-123/download')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should mark resume as downloaded and return markdown', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.resume.findFirst.mockResolvedValue(mockResume);
      mockPrismaClient.resume.update.mockResolvedValue({
        ...mockResume,
        downloadedAt: new Date()
      });

      const response = await request(app)
        .get('/api/resume/resume-123/download')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.markdown).toBe(mockResume.resumeMarkdown);
      expect(response.body.title).toBe(mockResume.title);

      // Verify downloadedAt was updated
      expect(mockPrismaClient.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-123' },
        data: expect.objectContaining({
          downloadedAt: expect.any(Date)
        })
      });
    });
  });
});
