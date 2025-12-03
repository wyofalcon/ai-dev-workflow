/**
 * Unit tests for Profile Analyzer (Hybrid Personality Scoring)
 *
 * Tests:
 * 1. BFI-20 Likert scale calculations
 * 2. Reverse scoring logic
 * 3. Score normalization (0-100 scale)
 * 4. Score fusion (70% Likert + 30% NLP)
 * 5. Confidence calculation
 * 6. Derived trait inference
 */

const {
  calculateBFI20Scores,
  fuseScores,
  calculateConfidence,
  deriveWorkPreferences,
  BFI_20_ITEMS,
  REVERSE_SCORED_ITEMS
} = require('../../../services/profileAnalyzer');

describe('Profile Analyzer - Unit Tests', () => {
  describe('BFI-20 Score Calculation', () => {
    it('should calculate openness score correctly', () => {
      // Openness items: q1, q5, q9, q13 (normal), q17 (reversed)
      const responses = {
        q1: 5,  // is original, comes up with new ideas
        q5: 5,  // is inventive
        q9: 5,  // has active imagination
        q13: 5, // values artistic experiences
        q17: 1, // prefers routine work (reversed, so counts as 5)
        // Fill other questions
        q2: 3, q3: 3, q4: 3, q6: 3, q7: 3, q8: 3, q10: 3,
        q11: 3, q12: 3, q14: 3, q15: 3, q16: 3, q18: 3, q19: 3, q20: 3
      };

      const scores = calculateBFI20Scores(responses);

      // All openness items = 5, so score should be very high
      expect(scores.openness).toBeGreaterThanOrEqual(90);
      expect(scores.openness).toBeLessThanOrEqual(100);
    });

    it('should calculate conscientiousness score correctly', () => {
      // Conscientiousness items: q3, q7, q11, q15 (normal), q19 (reversed)
      const responses = {
        q3: 5,  // does thorough job
        q7: 5,  // makes plans and follows through
        q11: 5, // is reliable
        q15: 5, // perseveres
        q19: 1, // tends to be lazy (reversed)
        // Fill others with neutral
        q1: 3, q2: 3, q4: 3, q5: 3, q6: 3, q8: 3, q9: 3, q10: 3,
        q12: 3, q13: 3, q14: 3, q16: 3, q17: 3, q18: 3, q20: 3
      };

      const scores = calculateBFI20Scores(responses);

      expect(scores.conscientiousness).toBeGreaterThanOrEqual(90);
    });

    it('should handle reverse-scored items correctly', () => {
      // Test q2 (tends to be quiet) - reversed for extraversion
      const responses = {
        q2: 5,  // tends to be quiet (high) → low extraversion
        q6: 1,  // is outgoing (low)
        q10: 5, // is reserved (reversed, high) → low extraversion
        q14: 5, // is shy (reversed, high) → low extraversion
        q18: 1, // is talkative (low)
        // Fill others
        q1: 3, q3: 3, q4: 3, q5: 3, q7: 3, q8: 3, q9: 3,
        q11: 3, q12: 3, q13: 3, q15: 3, q16: 3, q17: 3, q19: 3, q20: 3
      };

      const scores = calculateBFI20Scores(responses);

      // Should result in low extraversion
      expect(scores.extraversion).toBeLessThan(30);
    });

    it('should normalize scores to 0-100 range', () => {
      // All minimum responses (1)
      const minResponses = {
        q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1,
        q11: 1, q12: 1, q13: 1, q14: 1, q15: 1, q16: 1, q17: 1, q18: 1, q19: 1, q20: 1
      };

      const minScores = calculateBFI20Scores(minResponses);

      Object.values(minScores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      // All maximum responses (5)
      const maxResponses = {
        q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 5, q7: 5, q8: 5, q9: 5, q10: 5,
        q11: 5, q12: 5, q13: 5, q14: 5, q15: 5, q16: 5, q17: 5, q18: 5, q19: 5, q20: 5
      };

      const maxScores = calculateBFI20Scores(maxResponses);

      Object.values(maxScores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate all 5 OCEAN traits', () => {
      const responses = {
        q1: 4, q2: 3, q3: 5, q4: 2, q5: 4, q6: 3, q7: 5, q8: 2, q9: 4, q10: 3,
        q11: 5, q12: 4, q13: 4, q14: 3, q15: 5, q16: 4, q17: 2, q18: 3, q19: 2, q20: 4
      };

      const scores = calculateBFI20Scores(responses);

      expect(scores).toHaveProperty('openness');
      expect(scores).toHaveProperty('conscientiousness');
      expect(scores).toHaveProperty('extraversion');
      expect(scores).toHaveProperty('agreeableness');
      expect(scores).toHaveProperty('neuroticism');
    });

    it('should validate BFI-20 items configuration', () => {
      // Verify we have exactly 20 items distributed across 5 traits
      const allItems = [];

      Object.values(BFI_20_ITEMS).forEach(items => {
        allItems.push(...items);
      });

      // Should have 20 unique question numbers
      const uniqueItems = new Set(allItems);
      expect(uniqueItems.size).toBe(20);

      // Each trait should have 4 items (20/5 = 4)
      Object.values(BFI_20_ITEMS).forEach(items => {
        expect(items).toHaveLength(4);
      });
    });
  });

  describe('Score Fusion (Hybrid Approach)', () => {
    it('should weight Likert 70% and NLP 30%', () => {
      const likertScores = {
        openness: 80,
        conscientiousness: 70,
        extraversion: 60,
        agreeableness: 50,
        neuroticism: 40
      };

      const nlpScores = {
        openness: 90,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 60,
        neuroticism: 50
      };

      const fused = fuseScores(likertScores, nlpScores);

      // Openness: 80*0.7 + 90*0.3 = 56 + 27 = 83
      expect(fused.openness).toBe(83);

      // Conscientiousness: 70*0.7 + 80*0.3 = 49 + 24 = 73
      expect(fused.conscientiousness).toBe(73);

      // All scores should be integers
      Object.values(fused).forEach(score => {
        expect(Number.isInteger(score)).toBe(true);
      });
    });

    it('should handle custom weights', () => {
      const likertScores = { openness: 100, conscientiousness: 0, extraversion: 50, agreeableness: 50, neuroticism: 50 };
      const nlpScores = { openness: 0, conscientiousness: 100, extraversion: 50, agreeableness: 50, neuroticism: 50 };

      // 50/50 weight
      const equalFused = fuseScores(likertScores, nlpScores, { likert: 0.5, narrative: 0.5 });

      expect(equalFused.openness).toBe(50); // 100*0.5 + 0*0.5 = 50
      expect(equalFused.conscientiousness).toBe(50); // 0*0.5 + 100*0.5 = 50

      // 90/10 weight (heavily favor Likert)
      const likertHeavy = fuseScores(likertScores, nlpScores, { likert: 0.9, narrative: 0.1 });

      expect(likertHeavy.openness).toBe(90); // 100*0.9 + 0*0.1 = 90
    });

    it('should round to nearest integer', () => {
      const likertScores = { openness: 77, conscientiousness: 77, extraversion: 77, agreeableness: 77, neuroticism: 77 };
      const nlpScores = { openness: 88, conscientiousness: 88, extraversion: 88, agreeableness: 88, neuroticism: 88 };

      const fused = fuseScores(likertScores, nlpScores);

      // 77*0.7 + 88*0.3 = 53.9 + 26.4 = 80.3 → 80
      expect(fused.openness).toBe(80);
    });

    it('should handle edge cases (0 and 100)', () => {
      const likertScores = { openness: 0, conscientiousness: 100, extraversion: 0, agreeableness: 100, neuroticism: 0 };
      const nlpScores = { openness: 100, conscientiousness: 0, extraversion: 100, agreeableness: 0, neuroticism: 100 };

      const fused = fuseScores(likertScores, nlpScores);

      // 0*0.7 + 100*0.3 = 30
      expect(fused.openness).toBe(30);

      // 100*0.7 + 0*0.3 = 70
      expect(fused.conscientiousness).toBe(70);

      // All scores should be within 0-100
      Object.values(fused).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Confidence Calculation', () => {
    it('should return high confidence for consistent Likert and NLP scores', () => {
      const likertScores = { openness: 80, conscientiousness: 70, extraversion: 60, agreeableness: 50, neuroticism: 40 };
      const nlpScores = { openness: 82, conscientiousness: 72, extraversion: 58, agreeableness: 52, neuroticism: 38 };

      const confidence = calculateConfidence(likertScores, nlpScores, {});

      // Small differences should yield high confidence
      expect(confidence).toBeGreaterThan(0.8);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should return lower confidence for contradictory scores', () => {
      const likertScores = { openness: 90, conscientiousness: 90, extraversion: 90, agreeableness: 90, neuroticism: 10 };
      const nlpScores = { openness: 20, conscientiousness: 20, extraversion: 20, agreeableness: 20, neuroticism: 90 };

      const confidence = calculateConfidence(likertScores, nlpScores, {});

      // Large differences should yield low confidence
      expect(confidence).toBeLessThan(0.5);
    });

    it('should penalize inconsistent Likert responses', () => {
      const likertScores = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
      const nlpScores = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };

      // Highly inconsistent responses (contradictory items)
      const inconsistentResponses = {
        q1: 5, q5: 1, q9: 5, q13: 1 // Openness items all over the place
      };

      const confidence = calculateConfidence(likertScores, nlpScores, inconsistentResponses);

      // Should have lower confidence than consistent responses
      expect(confidence).toBeLessThan(0.9);
    });
  });

  describe('Derived Trait Inference', () => {
    it('should map high openness to creative work style', () => {
      const scores = {
        openness: 85,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived.workStyle).toContain('creative');
    });

    it('should map high conscientiousness to structured work style', () => {
      const scores = {
        openness: 50,
        conscientiousness: 90,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived.workStyle).toContain('structured');
    });

    it('should map high extraversion to collaborative communication', () => {
      const scores = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 85,
        agreeableness: 50,
        neuroticism: 50
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived.communicationStyle).toContain('expressive');
    });

    it('should map low extraversion to independent work', () => {
      const scores = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 25,
        agreeableness: 50,
        neuroticism: 50
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived.communicationStyle).toContain('thoughtful');
    });

    it('should determine leadership style from conscientiousness + agreeableness', () => {
      // High conscientiousness + high agreeableness = servant leadership
      const servantLeader = {
        openness: 50,
        conscientiousness: 85,
        extraversion: 50,
        agreeableness: 85,
        neuroticism: 30
      };

      const derived1 = deriveWorkPreferences(servantLeader);
      expect(derived1.leadershipStyle).toBeDefined();

      // High conscientiousness + low agreeableness = directive leadership
      const directiveLeader = {
        openness: 50,
        conscientiousness: 85,
        extraversion: 50,
        agreeableness: 30,
        neuroticism: 30
      };

      const derived2 = deriveWorkPreferences(directiveLeader);
      expect(derived2.leadershipStyle).toBeDefined();
      expect(derived2.leadershipStyle).not.toBe(derived1.leadershipStyle);
    });

    it('should infer motivation type from openness + conscientiousness', () => {
      const scores = {
        openness: 85,
        conscientiousness: 85,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 30
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived.motivationType).toBeDefined();
      expect(typeof derived.motivationType).toBe('string');
    });

    it('should infer decision-making style', () => {
      // High openness + low neuroticism = intuitive decision maker
      const intuitive = {
        openness: 85,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 25
      };

      const derived1 = deriveWorkPreferences(intuitive);
      expect(derived1.decisionMaking).toBeDefined();

      // Low openness + high conscientiousness = analytical decision maker
      const analytical = {
        openness: 30,
        conscientiousness: 85,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 30
      };

      const derived2 = deriveWorkPreferences(analytical);
      expect(derived2.decisionMaking).toBeDefined();
    });

    it('should return all 5 derived traits', () => {
      const scores = {
        openness: 70,
        conscientiousness: 75,
        extraversion: 60,
        agreeableness: 65,
        neuroticism: 35
      };

      const derived = deriveWorkPreferences(scores);

      expect(derived).toHaveProperty('workStyle');
      expect(derived).toHaveProperty('communicationStyle');
      expect(derived).toHaveProperty('leadershipStyle');
      expect(derived).toHaveProperty('motivationType');
      expect(derived).toHaveProperty('decisionMaking');
    });
  });
});
