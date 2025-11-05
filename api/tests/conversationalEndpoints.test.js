// Set environment BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock user
const mockUser = {
  id: 'user-123',
  firebaseUid: 'test-uid-123',
  email: 'test@example.com',
  resumesGenerated: 0,
  resumesLimit: 5,
  subscriptionTier: 'starter',
};

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('../config/database', () => mockPrismaClient);

// Mock Job Description Analyzer
const mockJDAnalysis = {
  jobTitle: 'Senior Software Engineer',
  company: 'Google',
  experienceLevel: 'senior',
  requiredSkills: {
    technical: ['React', 'Node.js', 'PostgreSQL'],
    soft: ['Leadership', 'Communication'],
    certifications: []
  },
  keyResponsibilities: ['Design scalable systems'],
  culturalIndicators: {
    workStyle: 'collaborative',
    pace: 'fast-paced',
    innovation: 'high'
  },
  topKeywords: ['React', 'Node.js', 'Leadership'],
  personalityTraits: ['Innovative']
};

const mockJDQuestions = [
  { id: 'jd_tech', question: 'Tech question?', purpose: 'tech', keywords: [] },
  { id: 'jd_resp', question: 'Responsibility question?', purpose: 'resp', keywords: [] },
  { id: 'jd_soft', question: 'Soft skill question?', purpose: 'soft', keywords: [] },
  { id: 'jd_exp', question: 'Experience question?', purpose: 'exp', keywords: [] },
  { id: 'jd_culture', question: 'Culture question?', purpose: 'culture', keywords: [] }
];

jest.mock('../services/jobDescriptionAnalyzer', () => {
  return jest.fn().mockImplementation(() => ({
    validateJobDescription: jest.fn((jd) => {
      if (jd.length < 50) {
        return { valid: false, reason: 'Job description is too short' };
      }
      return { valid: true };
    }),
    analyze: jest.fn().mockResolvedValue({
      jobDescription: 'Senior Software Engineer at Google...',
      analysis: mockJDAnalysis,
      questions: mockJDQuestions,
      analyzedAt: new Date().toISOString()
    })
  }));
});

// Mock Personality Questions
jest.mock('../services/personalityQuestions', () => ({
  buildFullConversation: jest.fn((jdQuestions) => {
    return [
      { step: 1, type: 'job_description', title: 'Job Description', required: true },
      ...jdQuestions.map((q, i) => ({
        step: i + 2,
        type: 'jd_specific',
        questionId: q.id,
        question: q.question,
        required: true
      })),
      { step: 7, type: 'personality', questionId: 'p1', question: 'P1?', required: true },
      { step: 8, type: 'personality', questionId: 'p2', question: 'P2?', required: true },
      { step: 9, type: 'personality', questionId: 'p3', question: 'P3?', required: true },
      { step: 10, type: 'personality', questionId: 'p4', question: 'P4?', required: true },
      { step: 11, type: 'personality', questionId: 'p5', question: 'P5?', required: true },
      { step: 12, type: 'personality', questionId: 'p6', question: 'P6?', required: true },
      { step: 13, type: 'processing', title: 'Processing', required: false }
    ];
  }),
  validateAnswer: jest.fn((questionId, answer) => {
    const wordCount = answer.trim().split(/\s+/).length;
    if (wordCount < 20) {
      return {
        valid: false,
        error: `Please provide more detail. We need at least 20 words (you wrote ${wordCount} words).`
      };
    }
    return { valid: true };
  })
}));

// Mock Gemini Service
jest.mock('../services/geminiServiceVertex', () => ({
  getFlashModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockJDAnalysis)
      }
    })
  }))
}));

// Use global Firebase mock from setup.js (no need to mock again)
const request = require('supertest');
const { app } = require('../index');

describe('Conversational Flow API Endpoints', () => {
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

  describe('POST /api/resume/analyze-jd', () => {
    const validJD = 'Senior Software Engineer at Google. Must have 5+ years experience with React, Node.js. Strong leadership skills required.';

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .send({ jobDescription: validJD })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if job description missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Job description is required');
    });

    it('should return 400 for too short JD', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: 'Too short' })
        .expect(400);

      expect(response.body.error).toContain('too short');
    });

    it('should successfully analyze valid JD', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: validJD })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.questions).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return analysis with correct structure', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: validJD })
        .expect(200);

      expect(response.body.analysis).toHaveProperty('jobTitle');
      expect(response.body.analysis).toHaveProperty('experienceLevel');
      expect(response.body.analysis).toHaveProperty('requiredSkills');
      expect(response.body.analysis).toHaveProperty('keyResponsibilities');
    });

    it('should generate 5 targeted questions', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: validJD })
        .expect(200);

      expect(response.body.questions).toHaveLength(5);
      expect(response.body.metadata.questionCount).toBe(5);
    });

    it('should include analyzedAt timestamp', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: validJD })
        .expect(200);

      expect(response.body.metadata.analyzedAt).toBeDefined();
      expect(new Date(response.body.metadata.analyzedAt)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/resume/conversation-flow', () => {
    const mockAnalysisResult = {
      analysis: mockJDAnalysis,
      questions: mockJDQuestions
    };

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if jdAnalysis missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('JD analysis required');
    });

    it('should return 400 if questions array missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: { analysis: mockJDAnalysis } })
        .expect(400);

      expect(response.body.error).toContain('JD analysis required');
    });

    it('should successfully build conversation flow', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.totalSteps).toBeDefined();
      expect(response.body.steps).toBeDefined();
      expect(Array.isArray(response.body.steps)).toBe(true);
    });

    it('should return 13 steps total', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(200);

      expect(response.body.totalSteps).toBe(13);
      expect(response.body.steps).toHaveLength(13);
    });

    it('should include metadata with breakdown', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(200);

      expect(response.body.metadata).toMatchObject({
        jdQuestions: 5,
        personalityQuestions: 6,
        processingSteps: 1,
        estimatedTimeMinutes: 10
      });
    });

    it('should have first step as job_description type', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(200);

      expect(response.body.steps[0].type).toBe('job_description');
      expect(response.body.steps[0].step).toBe(1);
    });

    it('should have last step as processing type', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: mockAnalysisResult })
        .expect(200);

      const lastStep = response.body.steps[response.body.steps.length - 1];
      expect(lastStep.type).toBe('processing');
      expect(lastStep.step).toBe(13);
    });
  });

  describe('POST /api/resume/validate-answer', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/resume/validate-answer')
        .send({ questionId: 'test_id', answer: 'Test answer' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if questionId missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ answer: 'Test answer' })
        .expect(400);

      expect(response.body.error).toContain('questionId and answer are required');
    });

    it('should return 400 if answer missing', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ questionId: 'test_id' })
        .expect(400);

      expect(response.body.error).toContain('questionId and answer are required');
    });

    it('should reject answer with too few words', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'personality_work_style',
          answer: 'Too short answer'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toContain('at least 20 words');
    });

    it('should accept answer with sufficient words', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const goodAnswer = 'I prefer collaborative environments where I can work with talented teams to solve complex problems. I find that brainstorming with others helps me generate innovative solutions and pushes me to think outside the box when approaching challenges.';

      const response = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'personality_work_style',
          answer: goodAnswer
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.error).toBeNull();
    });

    it('should return validation result structure', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'test_id',
          answer: 'Test answer'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Integration: Full Conversational Flow', () => {
    it('should complete full flow: analyze JD → get conversation → validate answers', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const validJD = 'Senior Software Engineer at Google. Must have 5+ years experience with React, Node.js. Strong leadership skills required. You will design scalable systems and mentor junior engineers.';

      // Step 1: Analyze JD
      const analysisResponse = await request(app)
        .post('/api/resume/analyze-jd')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jobDescription: validJD })
        .expect(200);

      expect(analysisResponse.body.success).toBe(true);

      // Step 2: Get conversation flow
      const flowResponse = await request(app)
        .post('/api/resume/conversation-flow')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ jdAnalysis: analysisResponse.body })
        .expect(200);

      expect(flowResponse.body.totalSteps).toBe(13);

      // Step 3: Validate answer
      const goodAnswer = 'I prefer collaborative environments where I can work with talented teams to solve complex problems. I find that brainstorming with others helps me generate innovative solutions and pushes me to think outside the box when approaching challenging technical issues.';

      const validationResponse = await request(app)
        .post('/api/resume/validate-answer')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          questionId: 'personality_work_style',
          answer: goodAnswer
        })
        .expect(200);

      expect(validationResponse.body.valid).toBe(true);
    });
  });
});
