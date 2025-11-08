const {
  QUESTION_CATEGORIES,
  QUESTIONS,
  getNextQuestion,
  getQuestionById,
  getTotalQuestions,
  getProgress,
} = require('../../../services/questionFramework');

describe('Question Framework', () => {
  describe('QUESTION_CATEGORIES', () => {
    it('should export all category constants', () => {
      expect(QUESTION_CATEGORIES).toHaveProperty('CAREER_FOUNDATION');
      expect(QUESTION_CATEGORIES).toHaveProperty('ACHIEVEMENT_STORIES');
      expect(QUESTION_CATEGORIES).toHaveProperty('WORK_STYLE');
      expect(QUESTION_CATEGORIES).toHaveProperty('PERSONAL_INSIGHTS');
      expect(QUESTION_CATEGORIES).toHaveProperty('VALUES_MOTIVATION');
    });

    it('should have human-readable category names', () => {
      expect(QUESTION_CATEGORIES.CAREER_FOUNDATION).toBe('Career Foundation');
      expect(QUESTION_CATEGORIES.ACHIEVEMENT_STORIES).toBe('Achievement Stories');
      expect(QUESTION_CATEGORIES.WORK_STYLE).toBe('Work Style & Environment');
      expect(QUESTION_CATEGORIES.PERSONAL_INSIGHTS).toBe('Personal Insights');
      expect(QUESTION_CATEGORIES.VALUES_MOTIVATION).toBe('Values & Motivation');
    });
  });

  describe('QUESTIONS', () => {
    it('should export an array of questions', () => {
      expect(Array.isArray(QUESTIONS)).toBe(true);
      expect(QUESTIONS.length).toBeGreaterThan(0);
    });

    it('should have at least 16 base questions', () => {
      const baseQuestions = QUESTIONS.filter((q) => !q.conditional);
      expect(baseQuestions.length).toBeGreaterThanOrEqual(16);
    });

    it('should have questions with required properties', () => {
      QUESTIONS.forEach((question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('category');
        expect(question).toHaveProperty('questionText');
        expect(question).toHaveProperty('purpose');
        expect(question).toHaveProperty('order');
      });
    });

    it('should have unique question IDs', () => {
      const ids = QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have questions in ascending order', () => {
      for (let i = 0; i < QUESTIONS.length - 1; i++) {
        expect(QUESTIONS[i].order).toBeLessThan(QUESTIONS[i + 1].order);
      }
    });

    it('should have conditional questions marked appropriately', () => {
      const conditionalQuestions = QUESTIONS.filter((q) => q.conditional);
      expect(conditionalQuestions.length).toBeGreaterThan(0);
      conditionalQuestions.forEach((q) => {
        expect(q.conditional).toBe(true);
      });
    });

    it('should have some questions with follow-ups', () => {
      const questionsWithFollowUp = QUESTIONS.filter((q) => q.followUp !== null);
      expect(questionsWithFollowUp.length).toBeGreaterThan(0);
    });

    it('should have questions covering all categories', () => {
      const categories = new Set(QUESTIONS.map((q) => q.category));
      Object.values(QUESTION_CATEGORIES).forEach((category) => {
        expect(categories.has(category)).toBe(true);
      });
    });
  });

  describe('getNextQuestion', () => {
    it('should return first question when currentQuestionIndex is -1', () => {
      const question = getNextQuestion(-1);
      expect(question).toBeDefined();
      expect(question.order).toBe(1);
    });

    it('should return second question when currentQuestionIndex is 0', () => {
      const question = getNextQuestion(0);
      expect(question).toBeDefined();
      expect(question.order).toBe(2);
    });

    it('should return questions in order', () => {
      const question1 = getNextQuestion(-1);
      const question2 = getNextQuestion(0);
      const question3 = getNextQuestion(1);

      expect(question1.order).toBe(1);
      expect(question2.order).toBe(2);
      expect(question3.order).toBe(3);
    });

    it('should skip conditional questions', () => {
      const baseQuestions = QUESTIONS.filter((q) => !q.conditional);
      const lastBaseIndex = baseQuestions.length - 2;

      const question = getNextQuestion(lastBaseIndex);
      expect(question).toBeDefined();
      expect(question.conditional).toBeUndefined();
    });

    it('should return null after all base questions are answered', () => {
      const baseQuestions = QUESTIONS.filter((q) => !q.conditional);
      const lastIndex = baseQuestions.length - 1;

      const question = getNextQuestion(lastIndex);
      expect(question).toBeNull();
    });

    it('should return null when given index beyond question list', () => {
      const question = getNextQuestion(999);
      expect(question).toBeNull();
    });

    it('should handle empty conversationContext', () => {
      const question = getNextQuestion(0, {});
      expect(question).toBeDefined();
    });

    it('should return only non-conditional questions', () => {
      let currentIndex = -1;
      let question = getNextQuestion(currentIndex);

      while (question !== null) {
        expect(question.conditional).toBeUndefined();
        currentIndex++;
        question = getNextQuestion(currentIndex);
      }
    });
  });

  describe('getQuestionById', () => {
    it('should return question by ID', () => {
      const question = getQuestionById('career_1');
      expect(question).toBeDefined();
      expect(question.id).toBe('career_1');
    });

    it('should return correct question for achievement_1', () => {
      const question = getQuestionById('achievement_1');
      expect(question).toBeDefined();
      expect(question.category).toBe(QUESTION_CATEGORIES.ACHIEVEMENT_STORIES);
    });

    it('should return conditional questions by ID', () => {
      const question = getQuestionById('bonus_leadership');
      expect(question).toBeDefined();
      expect(question.conditional).toBe(true);
    });

    it('should return undefined for non-existent ID', () => {
      const question = getQuestionById('non_existent_id');
      expect(question).toBeUndefined();
    });

    it('should return undefined for null ID', () => {
      const question = getQuestionById(null);
      expect(question).toBeUndefined();
    });

    it('should return undefined for empty string ID', () => {
      const question = getQuestionById('');
      expect(question).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const question = getQuestionById('CAREER_1');
      expect(question).toBeUndefined();
    });

    it('should return all properties of the question', () => {
      const question = getQuestionById('career_1');
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('category');
      expect(question).toHaveProperty('questionText');
      expect(question).toHaveProperty('purpose');
      expect(question).toHaveProperty('followUp');
      expect(question).toHaveProperty('order');
    });
  });

  describe('getTotalQuestions', () => {
    it('should return a number', () => {
      const total = getTotalQuestions();
      expect(typeof total).toBe('number');
    });

    it('should return at least 16', () => {
      const total = getTotalQuestions();
      expect(total).toBeGreaterThanOrEqual(16);
    });

    it('should not count conditional questions', () => {
      const total = getTotalQuestions();
      const baseQuestions = QUESTIONS.filter((q) => !q.conditional);
      expect(total).toBe(baseQuestions.length);
    });

    it('should be consistent across multiple calls', () => {
      const total1 = getTotalQuestions();
      const total2 = getTotalQuestions();
      expect(total1).toBe(total2);
    });

    it('should match the actual number of non-conditional questions', () => {
      const total = getTotalQuestions();
      const nonConditional = QUESTIONS.filter((q) => !q.conditional).length;
      expect(total).toBe(nonConditional);
    });
  });

  describe('getProgress', () => {
    it('should return 0% for no questions answered', () => {
      const progress = getProgress(-1);
      expect(progress).toBe(0);
    });

    it('should return percentage for first question', () => {
      const progress = getProgress(0);
      const total = getTotalQuestions();
      expect(progress).toBe(Math.round((1 / total) * 100));
    });

    it('should return 100% when all questions answered', () => {
      const total = getTotalQuestions();
      const progress = getProgress(total - 1);
      expect(progress).toBe(100);
    });

    it('should return increasing values for increasing indices', () => {
      const progress1 = getProgress(0);
      const progress2 = getProgress(5);
      const progress3 = getProgress(10);

      expect(progress2).toBeGreaterThan(progress1);
      expect(progress3).toBeGreaterThan(progress2);
    });

    it('should return integer percentages', () => {
      for (let i = 0; i < getTotalQuestions(); i++) {
        const progress = getProgress(i);
        expect(Number.isInteger(progress)).toBe(true);
      }
    });

    it('should return values between 0 and 100', () => {
      for (let i = -1; i < getTotalQuestions(); i++) {
        const progress = getProgress(i);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      }
    });

    it('should handle negative indices', () => {
      const progress = getProgress(-1);
      expect(progress).toBe(0);
    });

    it('should handle indices beyond total', () => {
      const progress = getProgress(999);
      const total = getTotalQuestions();
      expect(progress).toBeGreaterThan(100);
    });

    it('should calculate progress correctly for 50% completion', () => {
      const total = getTotalQuestions();
      const halfwayIndex = Math.floor(total / 2);
      const progress = getProgress(halfwayIndex);

      expect(progress).toBeGreaterThanOrEqual(45);
      expect(progress).toBeLessThanOrEqual(60); // Allow for rounding variations
    });
  });

  describe('Integration Tests', () => {
    it('should traverse all questions from start to finish', () => {
      const questions = [];
      let currentIndex = -1;
      let question = getNextQuestion(currentIndex);

      while (question !== null) {
        questions.push(question);
        currentIndex++;
        question = getNextQuestion(currentIndex);
      }

      expect(questions.length).toBe(getTotalQuestions());
    });

    it('should have consistent ordering throughout traversal', () => {
      let currentIndex = -1;
      let question = getNextQuestion(currentIndex);
      let previousOrder = 0;

      while (question !== null) {
        expect(question.order).toBeGreaterThan(previousOrder);
        previousOrder = question.order;
        currentIndex++;
        question = getNextQuestion(currentIndex);
      }
    });

    it('should find all returned questions by ID', () => {
      let currentIndex = -1;
      let question = getNextQuestion(currentIndex);

      while (question !== null) {
        const foundQuestion = getQuestionById(question.id);
        expect(foundQuestion).toEqual(question);
        currentIndex++;
        question = getNextQuestion(currentIndex);
      }
    });

    it('should reach 100% progress at completion', () => {
      let currentIndex = -1;
      let question = getNextQuestion(currentIndex);

      while (question !== null) {
        currentIndex++;
        question = getNextQuestion(currentIndex);
      }

      const finalProgress = getProgress(currentIndex);
      expect(finalProgress).toBe(100);
    });

    it('should have all base questions findable by ID', () => {
      const baseQuestions = QUESTIONS.filter((q) => !q.conditional);

      baseQuestions.forEach((expected) => {
        const found = getQuestionById(expected.id);
        expect(found).toEqual(expected);
      });
    });
  });

  describe('Data Validation', () => {
    it('should have no duplicate order numbers', () => {
      const orders = QUESTIONS.map((q) => q.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });

    it('should have orders starting from 1', () => {
      const minOrder = Math.min(...QUESTIONS.map((q) => q.order));
      expect(minOrder).toBe(1);
    });

    it('should have sequential orders with no gaps', () => {
      const orders = QUESTIONS.map((q) => q.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length - 1; i++) {
        expect(orders[i + 1] - orders[i]).toBe(1);
      }
    });

    it('should have non-empty question text for all questions', () => {
      QUESTIONS.forEach((question) => {
        expect(question.questionText).toBeTruthy();
        expect(question.questionText.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty purpose for all questions', () => {
      QUESTIONS.forEach((question) => {
        expect(question.purpose).toBeTruthy();
        expect(question.purpose.length).toBeGreaterThan(0);
      });
    });

    it('should have valid categories for all questions', () => {
      const validCategories = Object.values(QUESTION_CATEGORIES);
      QUESTIONS.forEach((question) => {
        expect(validCategories).toContain(question.category);
      });
    });
  });
});
