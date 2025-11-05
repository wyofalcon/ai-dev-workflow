const {
  inferPersonality,
  calculateTraitScore,
  determineWorkStyle,
  determineLeadershipStyle,
  determineCommunicationStyle,
  determineMotivationType,
} = require('../services/personalityInference');

describe('Personality Inference Service', () => {
  describe('calculateTraitScore', () => {
    const mockTrait = {
      high: ['creative', 'innovative', 'unique'],
      low: ['traditional', 'routine', 'standard'],
    };

    it('should return 50 for neutral text with no keywords', () => {
      const score = calculateTraitScore('This is plain text', mockTrait);
      expect(score).toBe(50);
    });

    it('should increase score for high trait keywords', () => {
      const score = calculateTraitScore('I am creative and innovative', mockTrait);
      expect(score).toBe(60); // 50 + (2 matches * 5)
    });

    it('should decrease score for low trait keywords', () => {
      const score = calculateTraitScore('I prefer traditional and routine approaches', mockTrait);
      expect(score).toBe(40); // 50 - (2 matches * 5)
    });

    it('should handle mixed high and low keywords', () => {
      const score = calculateTraitScore('creative but traditional', mockTrait);
      expect(score).toBe(50); // 50 + 5 - 5 = 50
    });

    it('should clamp score at 0 (minimum)', () => {
      const lowText = 'traditional routine standard '.repeat(30);
      const score = calculateTraitScore(lowText, mockTrait);
      expect(score).toBe(0); // Max negative should clamp at 0
    });

    it('should clamp score at 100 (maximum)', () => {
      const highText = 'creative innovative unique '.repeat(30);
      const score = calculateTraitScore(highText, mockTrait);
      expect(score).toBe(100); // Max positive should clamp at 100
    });

    it('should be case-insensitive', () => {
      const score1 = calculateTraitScore('CREATIVE INNOVATIVE', mockTrait);
      const score2 = calculateTraitScore('creative innovative', mockTrait);
      expect(score1).toBe(score2);
    });
  });

  describe('determineWorkStyle', () => {
    it('should return "collaborative" for team-oriented text', () => {
      const text = 'I love working with teams and collaborating with people in groups';
      const style = determineWorkStyle(text);
      expect(style).toBe('collaborative');
    });

    it('should return "independent" for solo-oriented text', () => {
      const text = 'I prefer working independently alone by myself on individual tasks';
      const style = determineWorkStyle(text);
      expect(style).toBe('independent');
    });

    it('should return "hybrid" for balanced text', () => {
      const text = 'I work with teams and groups but also do independent solo work alone';
      const style = determineWorkStyle(text);
      expect(style).toBe('hybrid');
    });

    it('should handle no work style keywords', () => {
      const text = 'I complete my tasks efficiently';
      const style = determineWorkStyle(text);
      expect(style).toBe('hybrid');
    });
  });

  describe('determineLeadershipStyle', () => {
    it('should return "servant" for supportive leadership', () => {
      const text = 'I support and help my team members to enable their success';
      const style = determineLeadershipStyle(text);
      expect(style).toBe('servant');
    });

    it('should return "democratic" for collaborative leadership', () => {
      const text = 'I seek consensus and encourage input through discussion and participation';
      const style = determineLeadershipStyle(text);
      expect(style).toBe('democratic');
    });

    it('should return "transformational" for visionary leadership', () => {
      const text = 'I inspire teams with vision and motivate change through innovation';
      const style = determineLeadershipStyle(text);
      expect(style).toBe('transformational');
    });

    it('should return "none" when no leadership indicators present', () => {
      const text = 'I complete my work on time';
      const style = determineLeadershipStyle(text);
      expect(style).toBe('none');
    });

    it('should return highest scoring style', () => {
      const text = 'I inspire and motivate but also support others'; // More transformational
      const style = determineLeadershipStyle(text);
      expect(style).toBe('transformational');
    });
  });

  describe('determineCommunicationStyle', () => {
    it('should return "direct" for straightforward communication', () => {
      const text = 'I am straightforward, clear, and direct in my communication';
      const style = determineCommunicationStyle(text);
      expect(style).toBe('direct');
    });

    it('should return "diplomatic" for considerate communication', () => {
      const text = 'I am careful and considerate, being tactful and sensitive';
      const style = determineCommunicationStyle(text);
      expect(style).toBe('diplomatic');
    });

    it('should return "analytical" for data-driven communication', () => {
      const text = 'I rely on data, facts, and metrics to analyze and provide logic';
      const style = determineCommunicationStyle(text);
      expect(style).toBe('analytical');
    });

    it('should return "expressive" for enthusiastic communication', () => {
      const text = 'I am enthusiastic and passionate with energetic storytelling';
      const style = determineCommunicationStyle(text);
      expect(style).toBe('expressive');
    });

    it('should handle ties by returning first alphabetically', () => {
      const text = 'I communicate clearly'; // Only 1 match, should default to first
      const style = determineCommunicationStyle(text);
      expect(['direct', 'diplomatic', 'analytical', 'expressive']).toContain(style);
    });
  });

  describe('determineMotivationType', () => {
    it('should return "achievement" for goal-oriented text', () => {
      const text = 'I set goals to accomplish targets and achieve success by winning';
      const type = determineMotivationType(text);
      expect(type).toBe('achievement');
    });

    it('should return "autonomy" for independence-focused text', () => {
      const text = 'I value freedom, control, and flexibility to work independently on my own';
      const type = determineMotivationType(text);
      expect(type).toBe('autonomy');
    });

    it('should return "mastery" for skill development text', () => {
      const text = 'I love to learn and improve my skills to develop mastery and expertise';
      const type = determineMotivationType(text);
      expect(type).toBe('mastery');
    });

    it('should return "purpose" for mission-driven text', () => {
      const text = 'I want to make an impact and find meaning by helping others contribute value';
      const type = determineMotivationType(text);
      expect(type).toBe('purpose');
    });
  });

  describe('inferPersonality', () => {
    it('should return complete personality profile', () => {
      const history = [
        { messageRole: 'assistant', messageContent: 'Question 1' },
        {
          messageRole: 'user',
          messageContent: 'I am creative and love learning new innovative approaches',
        },
        { messageRole: 'assistant', messageContent: 'Question 2' },
        {
          messageRole: 'user',
          messageContent: 'I work well with teams and enjoy collaborating',
        },
      ];

      const personality = inferPersonality(history);

      expect(personality).toHaveProperty('openness');
      expect(personality).toHaveProperty('conscientiousness');
      expect(personality).toHaveProperty('extraversion');
      expect(personality).toHaveProperty('agreeableness');
      expect(personality).toHaveProperty('neuroticism');
      expect(personality).toHaveProperty('workStyle');
      expect(personality).toHaveProperty('leadershipStyle');
      expect(personality).toHaveProperty('communicationStyle');
      expect(personality).toHaveProperty('motivationType');
      expect(personality).toHaveProperty('decisionMaking');
      expect(personality).toHaveProperty('inferenceConfidence');
      expect(personality).toHaveProperty('analysisVersion');
    });

    it('should only analyze user messages', () => {
      const history = [
        { messageRole: 'assistant', messageContent: 'creative innovative unique' },
        { messageRole: 'user', messageContent: 'plain text' },
      ];

      const personality = inferPersonality(history);

      // Should not pick up keywords from assistant messages
      expect(personality.openness).toBe(50); // Neutral, no keywords in user text
    });

    it('should calculate openness from creative keywords', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I am creative, innovative, and love exploring new ideas',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.openness).toBeGreaterThan(50);
    });

    it('should calculate conscientiousness from organization keywords', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I am organized, detail-oriented, and plan everything carefully',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.conscientiousness).toBeGreaterThan(50);
    });

    it('should calculate extraversion from social keywords', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I love working with teams, collaborating, and leading groups',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.extraversion).toBeGreaterThan(50);
    });

    it('should calculate agreeableness from empathy keywords', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I help and support others with empathy and compassion',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.agreeableness).toBeGreaterThan(50);
    });

    it('should calculate neuroticism from stress keywords', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I get stressed and worry under pressure' },
      ];

      const personality = inferPersonality(history);
      expect(personality.neuroticism).toBeGreaterThan(50);
    });

    it('should detect collaborative work style', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I thrive working with teams and collaborating with others',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.workStyle).toBe('collaborative');
    });

    it('should detect independent work style', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I prefer working independently and alone on my own',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.workStyle).toBe('independent');
    });

    it('should detect servant leadership style', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I support and help enable my team members' },
      ];

      const personality = inferPersonality(history);
      expect(personality.leadershipStyle).toBe('servant');
    });

    it('should detect democratic leadership style', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I seek consensus and encourage input from all' },
      ];

      const personality = inferPersonality(history);
      expect(personality.leadershipStyle).toBe('democratic');
    });

    it('should detect transformational leadership style', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I inspire and motivate teams with vision' },
      ];

      const personality = inferPersonality(history);
      expect(personality.leadershipStyle).toBe('transformational');
    });

    it('should detect direct communication style', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I communicate clearly, directly, and concisely' },
      ];

      const personality = inferPersonality(history);
      expect(personality.communicationStyle).toBe('direct');
    });

    it('should detect analytical communication style', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I rely on data, facts, and metrics to analyze situations',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.communicationStyle).toBe('analytical');
    });

    it('should detect achievement motivation', () => {
      const history = [
        { messageRole: 'user', messageContent: 'I set ambitious goals and strive to achieve them' },
      ];

      const personality = inferPersonality(history);
      expect(personality.motivationType).toBe('achievement');
    });

    it('should detect autonomy motivation', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I value freedom and flexibility to work independently',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.motivationType).toBe('autonomy');
    });

    it('should detect mastery motivation', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I love learning and improving my skills to develop expertise',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.motivationType).toBe('mastery');
    });

    it('should detect purpose motivation', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I want to make an impact and help others find meaning',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.motivationType).toBe('purpose');
    });

    it('should determine analytical decision-making for high conscientiousness', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent:
            'I am organized, detail-oriented, plan thoroughly, and follow schedules systematically',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.decisionMaking).toBe('analytical');
    });

    it('should determine intuitive decision-making for high openness', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I am creative, innovative, and love exploring new unique ideas',
        },
      ];

      const personality = inferPersonality(history);
      expect(personality.decisionMaking).toBe('intuitive');
    });

    it('should determine consultative decision-making for balanced traits', () => {
      const history = [{ messageRole: 'user', messageContent: 'I work well with others' }];

      const personality = inferPersonality(history);
      expect(personality.decisionMaking).toBe('consultative');
    });

    it('should calculate confidence based on completeness', () => {
      const fullHistory = Array.from({ length: 32 }, (_, i) => ({
        messageRole: i % 2 === 0 ? 'assistant' : 'user',
        messageContent: `Message ${i}`,
      }));

      const personality = inferPersonality(fullHistory);
      // 16 user messages / 16 questions = 1.0 completeness
      // 0.3 + 1.0 * 0.5 = 0.8
      expect(personality.inferenceConfidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should have lower confidence for partial conversations', () => {
      const partialHistory = [
        { messageRole: 'assistant', messageContent: 'Q1' },
        { messageRole: 'user', messageContent: 'A1' },
        { messageRole: 'assistant', messageContent: 'Q2' },
        { messageRole: 'user', messageContent: 'A2' },
      ];

      const personality = inferPersonality(partialHistory);
      expect(personality.inferenceConfidence).toBeLessThan(0.6);
    });

    it('should set analysis version to 1.0', () => {
      const history = [{ messageRole: 'user', messageContent: 'test' }];

      const personality = inferPersonality(history);
      expect(personality.analysisVersion).toBe('1.0');
    });

    it('should handle empty conversation history', () => {
      const history = [];

      const personality = inferPersonality(history);

      expect(personality.openness).toBe(50);
      expect(personality.conscientiousness).toBe(50);
      expect(personality.extraversion).toBe(50);
      expect(personality.agreeableness).toBe(50);
      expect(personality.neuroticism).toBe(50);
      expect(personality.inferenceConfidence).toBeGreaterThanOrEqual(0.3);
    });

    it('should handle only assistant messages', () => {
      const history = [
        { messageRole: 'assistant', messageContent: 'creative innovative' },
        { messageRole: 'assistant', messageContent: 'organized detail-oriented' },
      ];

      const personality = inferPersonality(history);

      // Should all be neutral since no user messages
      expect(personality.openness).toBe(50);
      expect(personality.conscientiousness).toBe(50);
    });

    it('should combine multiple user messages', () => {
      const history = [
        { messageRole: 'user', messageContent: 'creative' },
        { messageRole: 'user', messageContent: 'innovative' },
        { messageRole: 'user', messageContent: 'unique' },
      ];

      const personality = inferPersonality(history);
      expect(personality.openness).toBe(65); // 50 + (3 matches * 5)
    });

    it('should return all trait scores between 0 and 100', () => {
      const history = [
        {
          messageRole: 'user',
          messageContent: 'I am creative, organized, social, helpful, and calm',
        },
      ];

      const personality = inferPersonality(history);

      expect(personality.openness).toBeGreaterThanOrEqual(0);
      expect(personality.openness).toBeLessThanOrEqual(100);
      expect(personality.conscientiousness).toBeGreaterThanOrEqual(0);
      expect(personality.conscientiousness).toBeLessThanOrEqual(100);
      expect(personality.extraversion).toBeGreaterThanOrEqual(0);
      expect(personality.extraversion).toBeLessThanOrEqual(100);
      expect(personality.agreeableness).toBeGreaterThanOrEqual(0);
      expect(personality.agreeableness).toBeLessThanOrEqual(100);
      expect(personality.neuroticism).toBeGreaterThanOrEqual(0);
      expect(personality.neuroticism).toBeLessThanOrEqual(100);
    });

    it('should return confidence between 0 and 1', () => {
      const history = [{ messageRole: 'user', messageContent: 'test' }];

      const personality = inferPersonality(history);
      expect(personality.inferenceConfidence).toBeGreaterThanOrEqual(0);
      expect(personality.inferenceConfidence).toBeLessThanOrEqual(1);
    });
  });
});
