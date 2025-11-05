// Test personality questions framework
process.env.NODE_ENV = 'test';

const {
  PERSONALITY_QUESTIONS,
  getPersonalityQuestions,
  getQuestionById,
  validateAnswer,
  getQuestionHint,
  getFollowUpQuestion,
  buildFullConversation
} = require('../services/personalityQuestions');

describe('Personality Questions Framework', () => {
  describe('PERSONALITY_QUESTIONS constant', () => {
    it('should have exactly 6 questions', () => {
      expect(PERSONALITY_QUESTIONS).toHaveLength(6);
    });

    it('should have unique IDs for all questions', () => {
      const ids = PERSONALITY_QUESTIONS.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(6);
    });

    it('should have sequential orders from 6 to 11', () => {
      const orders = PERSONALITY_QUESTIONS.map(q => q.order).sort((a, b) => a - b);
      expect(orders).toEqual([6, 7, 8, 9, 10, 11]);
    });

    it('should have all required fields for each question', () => {
      PERSONALITY_QUESTIONS.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('order');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('purpose');
        expect(q).toHaveProperty('traits');
        expect(q).toHaveProperty('keywords');
        expect(q).toHaveProperty('followUp');
        expect(q).toHaveProperty('minWords');
      });
    });

    it('should have keywords as objects with category keys', () => {
      PERSONALITY_QUESTIONS.forEach(q => {
        expect(typeof q.keywords).toBe('object');
        expect(Array.isArray(q.keywords)).toBe(false);
        Object.values(q.keywords).forEach(categoryKeywords => {
          expect(Array.isArray(categoryKeywords)).toBe(true);
        });
      });
    });

    it('should target Big Five personality traits', () => {
      const validTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
      PERSONALITY_QUESTIONS.forEach(q => {
        q.traits.forEach(trait => {
          expect(validTraits).toContain(trait);
        });
      });
    });

    it('should have reasonable minimum word counts (20-50 words)', () => {
      PERSONALITY_QUESTIONS.forEach(q => {
        expect(q.minWords).toBeGreaterThanOrEqual(20);
        expect(q.minWords).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('getPersonalityQuestions', () => {
    it('should return all 6 questions', () => {
      const questions = getPersonalityQuestions();
      expect(questions).toHaveLength(6);
    });

    it('should return questions in order', () => {
      const questions = getPersonalityQuestions();
      const orders = questions.map(q => q.order);
      expect(orders).toEqual([6, 7, 8, 9, 10, 11]);
    });

    it('should return sorted array', () => {
      const questions = getPersonalityQuestions();
      const orders = questions.map(q => q.order);
      // Should be sorted in ascending order
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThan(orders[i-1]);
      }
    });
  });

  describe('getQuestionById', () => {
    it('should return question by valid ID', () => {
      const question = getQuestionById('personality_work_style');
      expect(question).toBeDefined();
      expect(question.id).toBe('personality_work_style');
    });

    it('should return undefined for invalid ID', () => {
      const question = getQuestionById('nonexistent_id');
      expect(question).toBeUndefined();
    });

    it('should return correct question for each personality type', () => {
      const workStyle = getQuestionById('personality_work_style');
      const problemSolving = getQuestionById('personality_problem_solving');
      const leadership = getQuestionById('personality_leadership');
      const adaptability = getQuestionById('personality_adaptability');
      const motivation = getQuestionById('personality_motivation');
      const communication = getQuestionById('personality_communication');

      expect(workStyle.type).toBe('work_style');
      expect(problemSolving.type).toBe('problem_solving');
      expect(leadership.type).toBe('leadership');
      expect(adaptability.type).toBe('adaptability');
      expect(motivation.type).toBe('motivation');
      expect(communication.type).toBe('communication');
    });
  });

  describe('validateAnswer', () => {
    it('should reject answer with too few words', () => {
      const result = validateAnswer('personality_work_style', 'I like to work alone');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should accept answer with sufficient words', () => {
      const goodAnswer = 'I prefer collaborative environments where I can work with talented teams to solve complex problems. I find that brainstorming with others helps me generate innovative solutions and pushes me to think outside the box.';
      const result = validateAnswer('personality_work_style', goodAnswer);
      expect(result.valid).toBe(true);
    });

    it('should reject answer with too many words', () => {
      const tooLong = 'word '.repeat(501); // 501 words
      const result = validateAnswer('personality_work_style', tooLong);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('under 500 words');
    });

    it('should return error for invalid question ID', () => {
      const result = validateAnswer('invalid_id', 'Some answer');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid question ID');
    });

    it('should enforce correct minimum for problem-solving question', () => {
      const problemSolving = getQuestionById('personality_problem_solving');
      const shortAnswer = 'word '.repeat(problemSolving.minWords - 1);
      const result = validateAnswer('personality_problem_solving', shortAnswer.trim());
      expect(result.valid).toBe(false);
    });

    it('should count words correctly (whitespace handling)', () => {
      // Exactly 30 words (work_style requires 30 min)
      const answer = 'word '.repeat(30).trim();
      const result = validateAnswer('personality_work_style', answer);
      expect(result.valid).toBe(true);
    });
  });

  describe('getQuestionHint', () => {
    it('should return hint for each question type', () => {
      const workStyleHint = getQuestionHint('personality_work_style');
      const problemSolvingHint = getQuestionHint('personality_problem_solving');
      const leadershipHint = getQuestionHint('personality_leadership');
      const adaptabilityHint = getQuestionHint('personality_adaptability');
      const motivationHint = getQuestionHint('personality_motivation');
      const communicationHint = getQuestionHint('personality_communication');

      expect(workStyleHint).toBeDefined();
      expect(problemSolvingHint).toBeDefined();
      expect(leadershipHint).toBeDefined();
      expect(adaptabilityHint).toBeDefined();
      expect(motivationHint).toBeDefined();
      expect(communicationHint).toBeDefined();

      expect(workStyleHint.length).toBeGreaterThan(20);
    });

    it('should return default hint for unknown question ID', () => {
      const hint = getQuestionHint('unknown_id');
      expect(hint).toBe('Share a specific example with concrete details.');
    });

    it('should start with "Think about:"', () => {
      const hint = getQuestionHint('personality_work_style');
      expect(hint).toMatch(/^Think about:/);
    });
  });

  describe('getFollowUpQuestion', () => {
    const goodAnswer = 'I prefer collaborative environments where I can work with talented teams to solve complex problems. I find that brainstorming with others helps me generate innovative solutions. For example, in my last project we increased efficiency by 40%.';

    it('should return default follow-up for good answer with specifics', () => {
      const followUp = getFollowUpQuestion('personality_work_style', goodAnswer);
      const question = getQuestionById('personality_work_style');
      expect(followUp).toBe(question.followUp);
    });

    it('should prompt for specifics if answer lacks details', () => {
      const vagueAnswer = 'I like working with people and solving problems in teams.';
      const followUp = getFollowUpQuestion('personality_problem_solving', vagueAnswer);
      expect(followUp).toContain('specific details');
    });

    it('should not prompt for metrics on motivation question', () => {
      const motivationAnswer = 'I am proud of building a community platform because it helped people connect.';
      const followUp = getFollowUpQuestion('personality_motivation', motivationAnswer);
      const question = getQuestionById('personality_motivation');
      expect(followUp).toBe(question.followUp);
    });

    it('should return null for invalid question ID', () => {
      const followUp = getFollowUpQuestion('invalid_id', 'Some answer');
      expect(followUp).toBeNull();
    });
  });

  describe('buildFullConversation', () => {
    const mockJDQuestions = [
      { id: 'jd_1', question: 'Tell me about your experience with React and Node.js development', purpose: 'test', keywords: [], followUp: 'Follow-up 1' },
      { id: 'jd_2', question: 'Describe a challenging technical problem you solved recently', purpose: 'test', keywords: [], followUp: 'Follow-up 2' },
      { id: 'jd_3', question: 'What leadership experience do you have with engineering teams?', purpose: 'test', keywords: [], followUp: 'Follow-up 3' },
      { id: 'jd_4', question: 'How do you approach code reviews and quality assurance?', purpose: 'test', keywords: [], followUp: 'Follow-up 4' },
      { id: 'jd_5', question: 'Share your experience with cloud infrastructure and DevOps', purpose: 'test', keywords: [], followUp: 'Follow-up 5' }
    ];

    it('should return 13 steps total', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      expect(conversation).toHaveLength(13);
    });

    it('should start with JD input step', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      expect(conversation[0]).toMatchObject({
        step: 1,
        type: 'job_description',
        title: 'Job Description',
        required: true
      });
    });

    it('should include 5 JD-specific questions (steps 2-6)', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      const jdSteps = conversation.slice(1, 6);
      jdSteps.forEach((step, index) => {
        expect(step.type).toBe('jd_specific');
        expect(step.step).toBe(index + 2);
        expect(step.required).toBe(true);
      });
    });

    it('should include 6 personality questions (steps 7-12)', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      const personalitySteps = conversation.slice(6, 12);
      personalitySteps.forEach((step, index) => {
        expect(step.type).toBe('personality');
        expect(step.step).toBe(index + 7);
        expect(step.required).toBe(true);
        expect(step.hint).toBeDefined();
      });
    });

    it('should end with processing step', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      const lastStep = conversation[12];
      expect(lastStep).toMatchObject({
        step: 13,
        type: 'processing',
        title: 'Analyzing Your Profile',
        required: false
      });
    });

    it('should include all required fields for each step', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      conversation.forEach(step => {
        expect(step).toHaveProperty('step');
        expect(step).toHaveProperty('type');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('required');
      });
    });

    it('should include question text for question steps', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      // Steps 2-12 are actual questions (skip step 1 which is JD input with no question)
      const questionSteps = conversation.slice(1, 12); // steps 2-12
      questionSteps.forEach(step => {
        expect(step.question).toBeDefined();
        expect(step.question).not.toBeNull();
        expect(step.question.length).toBeGreaterThan(20);
      });
    });

    it('should include personality traits for personality questions', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      const personalitySteps = conversation.slice(6, 12);
      personalitySteps.forEach(step => {
        expect(Array.isArray(step.traits)).toBe(true);
        expect(step.traits.length).toBeGreaterThan(0);
      });
    });

    it('should preserve JD question IDs', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      const jdSteps = conversation.slice(1, 6);
      jdSteps.forEach((step, index) => {
        expect(step.questionId).toBe(mockJDQuestions[index].id);
      });
    });

    it('should have incrementing step numbers', () => {
      const conversation = buildFullConversation(mockJDQuestions);
      conversation.forEach((step, index) => {
        expect(step.step).toBe(index + 1);
      });
    });
  });

  describe('Question Quality', () => {
    it('work_style question should mention environment and approach', () => {
      const question = getQuestionById('personality_work_style');
      expect(question.question).toContain('environment');
      expect(question.question).toContain('approach');
    });

    it('problem_solving question should ask about complex problems', () => {
      const question = getQuestionById('personality_problem_solving');
      expect(question.question).toContain('complex');
      expect(question.question).toContain('problem');
    });

    it('leadership question should ask about influence', () => {
      const question = getQuestionById('personality_leadership');
      expect(question.question).toContain('influenced');
    });

    it('adaptability question should ask about change', () => {
      const question = getQuestionById('personality_adaptability');
      expect(question.question).toContain('changed');
      expect(question.question).toContain('unexpected');
    });

    it('motivation question should ask about pride', () => {
      const question = getQuestionById('personality_motivation');
      expect(question.question).toContain('proud');
    });

    it('communication question should ask about style', () => {
      const question = getQuestionById('personality_communication');
      expect(question.question).toContain('communicate');
    });
  });

  describe('Keyword Coverage', () => {
    it('work_style should have independent vs collaborative keywords', () => {
      const question = getQuestionById('personality_work_style');
      expect(question.keywords).toHaveProperty('independent');
      expect(question.keywords).toHaveProperty('collaborative');
      expect(question.keywords.independent).toContain('alone');
      expect(question.keywords.collaborative).toContain('team');
    });

    it('problem_solving should have analytical vs creative keywords', () => {
      const question = getQuestionById('personality_problem_solving');
      expect(question.keywords).toHaveProperty('analytical');
      expect(question.keywords).toHaveProperty('creative');
    });

    it('leadership should have directive vs collaborative keywords', () => {
      const question = getQuestionById('personality_leadership');
      expect(question.keywords).toHaveProperty('directive');
      expect(question.keywords).toHaveProperty('collaborative');
    });

    it('adaptability should have calm vs anxious keywords', () => {
      const question = getQuestionById('personality_adaptability');
      expect(question.keywords).toHaveProperty('calm');
      expect(question.keywords).toHaveProperty('anxious');
    });

    it('motivation should have achievement, recognition, impact keywords', () => {
      const question = getQuestionById('personality_motivation');
      expect(question.keywords).toHaveProperty('achievement');
      expect(question.keywords).toHaveProperty('recognition');
      expect(question.keywords).toHaveProperty('impact');
    });

    it('communication should have detailed vs concise keywords', () => {
      const question = getQuestionById('personality_communication');
      expect(question.keywords).toHaveProperty('detailed');
      expect(question.keywords).toHaveProperty('concise');
    });
  });
});
