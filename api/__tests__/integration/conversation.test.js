const request = require('supertest');
const express = require('express');

// Create shared mock prisma instance
let mockPrisma;

// Mock dependencies BEFORE requiring the modules
jest.mock('@prisma/client', () => {
  mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    personalityTrait: {
      upsert: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});
jest.mock('../middleware/authMiddleware');
jest.mock('../services/questionFramework');
jest.mock('../services/personalityInference');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-123' }));

// NOW require the modules that depend on mocks
const conversationRouter = require('../../routes/conversation');
const { verifyFirebaseToken } = require('../../../middleware/authMiddleware');
const {
  getNextQuestion,
  getQuestionById,
  getTotalQuestions,
  getProgress,
} = require('../../services/questionFramework');
const { inferPersonality } = require('../../services/personalityInference');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/conversation', conversationRouter);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

describe('Conversation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    verifyFirebaseToken.mockImplementation((req, res, next) => {
      req.user = { firebaseUid: 'test-firebase-uid' };
      next();
    });

    getTotalQuestions.mockReturnValue(16);
    getProgress.mockReturnValue(50);
  });

  describe('POST /api/conversation/start', () => {
    it('should start a new conversation successfully', async () => {
      const mockUser = { id: 1, displayName: 'John Doe' };
      const mockQuestion = {
        id: 'q1',
        questionText: 'What is your biggest achievement?',
        category: 'achievements',
        order: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      getNextQuestion.mockReturnValue(mockQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/start')
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Conversation started successfully',
        sessionId: 'mock-uuid-123',
        currentQuestion: {
          id: 'q1',
          text: 'What is your biggest achievement?',
          category: 'achievements',
          order: 1,
        },
        progress: {
          current: 0,
          total: 16,
          percentage: 0,
        },
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'test-firebase-uid' },
        select: { id: true, displayName: true },
      });

      expect(getNextQuestion).toHaveBeenCalledWith(-1);
      expect(mockPrisma.conversation.create).toHaveBeenCalledTimes(2); // Welcome + first question
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/conversation/start')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'User Not Found',
        message: 'User account not found',
      });
    });

    it('should return 500 when question framework fails', async () => {
      const mockUser = { id: 1, displayName: 'John Doe' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      getNextQuestion.mockReturnValue(null);

      const response = await request(app)
        .post('/api/conversation/start')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Question Framework Error',
        message: 'Unable to load first question',
      });
    });

    it('should create welcome message with user name', async () => {
      const mockUser = { id: 1, displayName: 'Alice' };
      const mockQuestion = {
        id: 'q1',
        questionText: 'Question 1',
        category: 'test',
        order: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      getNextQuestion.mockReturnValue(mockQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      await request(app).post('/api/conversation/start').expect(201);

      const welcomeCall = mockPrisma.conversation.create.mock.calls[0][0];
      expect(welcomeCall.data.messageContent).toContain('Hi Alice!');
    });

    it('should handle user without display name', async () => {
      const mockUser = { id: 1, displayName: null };
      const mockQuestion = {
        id: 'q1',
        questionText: 'Question 1',
        category: 'test',
        order: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      getNextQuestion.mockReturnValue(mockQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      await request(app).post('/api/conversation/start').expect(201);

      const welcomeCall = mockPrisma.conversation.create.mock.calls[0][0];
      expect(welcomeCall.data.messageContent).toContain('Hi there!');
    });
  });

  describe('POST /api/conversation/message', () => {
    it('should process user message and return next question', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'assistant', messageContent: 'Welcome', messageOrder: 0 },
        { messageRole: 'assistant', messageContent: 'Question 1', messageOrder: 1 },
      ];
      const mockCurrentQuestion = {
        id: 'q1',
        order: 1,
        category: 'achievements',
      };
      const mockNextQuestion = {
        id: 'q2',
        questionText: 'Next question?',
        category: 'skills',
        order: 2,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockCurrentQuestion);
      getNextQuestion.mockReturnValue(mockNextQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'My answer to question 1',
          currentQuestionId: 'q1',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Message processed successfully',
        response: 'Next question?',
        nextQuestion: {
          id: 'q2',
          text: 'Next question?',
          category: 'skills',
          order: 2,
        },
        isComplete: false,
      });

      expect(mockPrisma.conversation.create).toHaveBeenCalledTimes(2); // User message + next question
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/api/conversation/message')
        .send({ message: 'Test message' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Missing Required Fields',
        message: 'sessionId and message are required',
      });
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/conversation/message')
        .send({ sessionId: 'session-123' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Missing Required Fields',
        message: 'sessionId and message are required',
      });
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'Test message',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'User Not Found',
      });
    });

    it('should return 404 when session not found', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue([]); // Empty history

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'invalid-session',
          message: 'Test message',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Session Not Found',
      });
    });

    it('should handle follow-up questions', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'assistant', messageContent: 'Question', messageOrder: 0 },
      ];
      const mockCurrentQuestion = {
        id: 'q1',
        order: 1,
        category: 'achievements',
        followUp: 'Can you tell me more about that?',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockCurrentQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'My answer',
          currentQuestionId: 'q1',
        })
        .expect(200);

      expect(response.body.response).toBe('Can you tell me more about that?');
      expect(response.body.nextQuestion.id).toBe('q1'); // Same question
    });

    it('should mark conversation as complete when no more questions', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'assistant', messageContent: 'Last question', messageOrder: 0 },
      ];
      const mockCurrentQuestion = {
        id: 'q16',
        order: 16,
        category: 'final',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockCurrentQuestion);
      getNextQuestion.mockReturnValue(null); // No more questions
      mockPrisma.conversation.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'Final answer',
          currentQuestionId: 'q16',
        })
        .expect(200);

      expect(response.body.isComplete).toBe(true);
      expect(response.body.nextQuestion).toBeNull();
      expect(response.body.response).toContain('Amazing! 🎉');
    });

    it('should track response time', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'assistant', messageContent: 'Question', messageOrder: 0 },
      ];
      const mockCurrentQuestion = { id: 'q1', order: 1, category: 'test' };
      const mockNextQuestion = { id: 'q2', questionText: 'Next', category: 'test', order: 2 };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockCurrentQuestion);
      getNextQuestion.mockReturnValue(mockNextQuestion);
      mockPrisma.conversation.create.mockResolvedValue({});

      await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'Answer',
          currentQuestionId: 'q1',
        })
        .expect(200);

      // Check that responseTimeMs was set in the assistant message
      const assistantCall = mockPrisma.conversation.create.mock.calls[1][0];
      expect(assistantCall.data.responseTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/conversation/history/:sessionId', () => {
    it('should return conversation history successfully', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        {
          id: 1,
          messageRole: 'assistant',
          messageContent: 'Welcome',
          messageOrder: 0,
          questionId: null,
          questionCategory: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          messageRole: 'assistant',
          messageContent: 'Question 1',
          messageOrder: 1,
          questionId: 'q1',
          questionCategory: 'achievements',
          createdAt: new Date(),
        },
        {
          id: 3,
          messageRole: 'user',
          messageContent: 'My answer',
          messageOrder: 2,
          questionId: 'q1',
          questionCategory: 'achievements',
          createdAt: new Date(),
        },
      ];
      const mockQuestion = {
        id: 'q1',
        questionText: 'Question 1',
        category: 'achievements',
        order: 1,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockQuestion);

      const response = await request(app)
        .get('/api/conversation/history/session-123')
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: 'session-123',
        messages: mockHistory,
        currentQuestion: {
          id: 'q1',
          text: 'Question 1',
          category: 'achievements',
          order: 1,
        },
      });
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/conversation/history/session-123')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'User Not Found',
      });
    });

    it('should return 404 when session not found', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/conversation/history/invalid-session')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Session Not Found',
      });
    });

    it('should find current question from last assistant message', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        {
          id: 1,
          messageRole: 'assistant',
          messageContent: 'Question 1',
          messageOrder: 0,
          questionId: 'q1',
          questionCategory: 'test',
          createdAt: new Date(),
        },
        {
          id: 2,
          messageRole: 'user',
          messageContent: 'Answer 1',
          messageOrder: 1,
          questionId: 'q1',
          questionCategory: 'test',
          createdAt: new Date(),
        },
        {
          id: 3,
          messageRole: 'assistant',
          messageContent: 'Question 2',
          messageOrder: 2,
          questionId: 'q2',
          questionCategory: 'test',
          createdAt: new Date(),
        },
      ];
      const mockQuestion = {
        id: 'q2',
        questionText: 'Question 2',
        category: 'test',
        order: 2,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      getQuestionById.mockReturnValue(mockQuestion);

      const response = await request(app)
        .get('/api/conversation/history/session-123')
        .expect(200);

      expect(response.body.currentQuestion.id).toBe('q2');
      expect(getQuestionById).toHaveBeenCalledWith('q2');
    });
  });

  describe('POST /api/conversation/complete', () => {
    it('should complete profile successfully', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'assistant', messageContent: 'Q1', messageOrder: 0 },
        { messageRole: 'user', messageContent: 'A1', messageOrder: 1 },
        { messageRole: 'assistant', messageContent: 'Q2', messageOrder: 2 },
        { messageRole: 'user', messageContent: 'A2', messageOrder: 3 },
      ];
      const mockPersonality = {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.6,
        agreeableness: 0.75,
        neuroticism: 0.3,
        workStyle: 'collaborative',
        leadershipStyle: 'democratic',
        communicationStyle: 'direct',
        motivationType: 'achievement',
        decisionMaking: 'analytical',
        inferenceConfidence: 0.85,
        analysisVersion: '1.0',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      inferPersonality.mockReturnValue(mockPersonality);
      getTotalQuestions.mockReturnValue(16);
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.personalityTrait.upsert.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/complete')
        .send({ sessionId: 'session-123' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Profile completed successfully',
        profileCompleteness: 13, // 2 user messages / 16 questions * 100 ≈ 13%
        personality: mockPersonality,
        nextStep: 'generate_resume',
      });

      expect(inferPersonality).toHaveBeenCalledWith(mockHistory);
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalled();
      expect(mockPrisma.personalityTrait.upsert).toHaveBeenCalled();
    });

    it('should return 400 when sessionId is missing', async () => {
      const response = await request(app)
        .post('/api/conversation/complete')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Missing Required Fields',
        message: 'sessionId is required',
      });
    });

    it('should return 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/conversation/complete')
        .send({ sessionId: 'session-123' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'User Not Found',
      });
    });

    it('should return 404 when session not found', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/conversation/complete')
        .send({ sessionId: 'invalid-session' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Session Not Found',
      });
    });

    it('should calculate profile completeness correctly', async () => {
      const mockUser = { id: 1 };
      const mockHistory = Array.from({ length: 32 }, (_, i) => ({
        messageRole: i % 2 === 0 ? 'assistant' : 'user',
        messageContent: `Message ${i}`,
        messageOrder: i,
      }));
      const mockPersonality = {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        workStyle: 'test',
        leadershipStyle: 'test',
        communicationStyle: 'test',
        motivationType: 'test',
        decisionMaking: 'test',
        inferenceConfidence: 0.5,
        analysisVersion: '1.0',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      inferPersonality.mockReturnValue(mockPersonality);
      getTotalQuestions.mockReturnValue(16);
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.personalityTrait.upsert.mockResolvedValue({});

      const response = await request(app)
        .post('/api/conversation/complete')
        .send({ sessionId: 'session-123' })
        .expect(200);

      // 16 user messages / 16 total questions = 100%
      expect(response.body.profileCompleteness).toBe(100);
    });

    it('should save personality traits to database', async () => {
      const mockUser = { id: 1 };
      const mockHistory = [
        { messageRole: 'user', messageContent: 'Answer', messageOrder: 0 },
      ];
      const mockPersonality = {
        openness: 0.9,
        conscientiousness: 0.8,
        extraversion: 0.7,
        agreeableness: 0.85,
        neuroticism: 0.2,
        workStyle: 'independent',
        leadershipStyle: 'visionary',
        communicationStyle: 'persuasive',
        motivationType: 'growth',
        decisionMaking: 'intuitive',
        inferenceConfidence: 0.95,
        analysisVersion: '1.0',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockResolvedValue(mockHistory);
      inferPersonality.mockReturnValue(mockPersonality);
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.personalityTrait.upsert.mockResolvedValue({});

      await request(app)
        .post('/api/conversation/complete')
        .send({ sessionId: 'session-123' })
        .expect(200);

      const personalityCall = mockPrisma.personalityTrait.upsert.mock.calls[0][0];
      expect(personalityCall.create).toMatchObject(mockPersonality);
      expect(personalityCall.update).toMatchObject(mockPersonality);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      verifyFirebaseToken.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app).post('/api/conversation/start').expect(401);
      await request(app).post('/api/conversation/message').send({}).expect(401);
      await request(app).get('/api/conversation/history/session-123').expect(401);
      await request(app).post('/api/conversation/complete').send({}).expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/conversation/start')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    it('should handle errors in message processing', async () => {
      const mockUser = { id: 1 };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findMany.mockRejectedValue(new Error('Query failed'));

      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          sessionId: 'session-123',
          message: 'Test',
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});
