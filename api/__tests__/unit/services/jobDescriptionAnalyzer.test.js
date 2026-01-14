// Set environment BEFORE any imports
process.env.NODE_ENV = 'test';

// Mock Gemini Service
const mockGeminiAnalysis = {
  analysis: {
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    experienceLevel: 'senior',
    requiredSkills: {
      technical: ['React', 'Node.js', 'PostgreSQL'],
      soft: ['Leadership', 'Communication'],
      certifications: []
    },
    keyResponsibilities: [
      'Design scalable systems',
      'Mentor junior engineers'
    ],
    culturalIndicators: {
      workStyle: 'collaborative',
      pace: 'fast-paced',
      innovation: 'high'
    },
    educationRequired: 'Bachelor\'s in CS',
    locationInfo: {
      location: 'Mountain View, CA',
      isRemote: false,
      isHybrid: true
    },
    salaryRange: {
      min: 150000,
      max: 200000,
      currency: 'USD',
      disclosed: true
    },
    topKeywords: ['React', 'Node.js', 'PostgreSQL', 'Leadership', 'Scalability'],
    personalityTraits: ['Innovative', 'Detail-oriented', 'Team player'],
    resumeGapAnalysis: {
      strengths: [],
      weaknesses: [],
      missingContent: [],
      atsMatchScore: 0,
      questionCount: 5
    }
  },
  questions: [
    { id: 'q1', type: 'technical', question: 'Q1', purpose: 'P1', gapType: 'comprehensive' },
    { id: 'q2', type: 'technical', question: 'Q2', purpose: 'P2', gapType: 'comprehensive' },
    { id: 'q3', type: 'technical', question: 'Q3', purpose: 'P3', gapType: 'comprehensive' },
    { id: 'q4', type: 'technical', question: 'Q4', purpose: 'P4', gapType: 'comprehensive' },
    { id: 'q5', type: 'technical', question: 'Q5', purpose: 'P5', gapType: 'comprehensive' }
  ]
};

const mockGeminiService = {
  getFlashModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockGeminiAnalysis)
      }
    })
  }))
};

const JobDescriptionAnalyzer = require('../../../services/jobDescriptionAnalyzer');

describe('Job Description Analyzer Service', () => {
  let analyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new JobDescriptionAnalyzer(mockGeminiService);
  });

  describe('validateJobDescription', () => {
    it('should reject job descriptions that are too short', () => {
      const result = analyzer.validateJobDescription('Too short');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too short');
    });

    it('should reject job descriptions that are too long', () => {
      const longJD = 'a'.repeat(25000);
      const result = analyzer.validateJobDescription(longJD);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too long');
    });

    it('should reject text without job-related keywords', () => {
      const notAJD = 'This is just some random text about nothing related to jobs at all';
      const result = analyzer.validateJobDescription(notAJD);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('doesn\'t appear to be a job description');
    });

    it('should accept valid job descriptions', () => {
      const validJD = 'We are seeking a talented Software Engineer with 5+ years of experience in React and Node.js. The ideal candidate will have strong problem-solving skills and work well in a team environment. Responsibilities include designing scalable systems and mentoring junior developers.';
      const result = analyzer.validateJobDescription(validJD);
      expect(result.valid).toBe(true);
    });
  });

  describe('analyze', () => {
    const validJD = 'Senior Software Engineer at Google. Must have 5+ years experience with React, Node.js. Strong leadership skills required. You will design scalable systems and mentor junior engineers.';

    it('should successfully analyze a job description', async () => {
      const result = await analyzer.analyze(validJD);

      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('analyzedAt');
      expect(result.jobDescription).toBe(validJD);
    });

    it('should extract job title correctly', async () => {
      const result = await analyzer.analyze(validJD);
      expect(result.analysis.jobTitle).toBe('Senior Software Engineer');
    });

    it('should identify experience level', async () => {
      const result = await analyzer.analyze(validJD);
      expect(result.analysis.experienceLevel).toBe('senior');
    });

    it('should extract technical skills', async () => {
      const result = await analyzer.analyze(validJD);
      expect(result.analysis.requiredSkills.technical).toContain('React');
      expect(result.analysis.requiredSkills.technical).toContain('Node.js');
    });

    it('should extract soft skills', async () => {
      const result = await analyzer.analyze(validJD);
      expect(result.analysis.requiredSkills.soft).toContain('Leadership');
    });

    it('should generate 5 targeted questions', async () => {
      const result = await analyzer.analyze(validJD);
      expect(result.questions).toHaveLength(5);
    });

    it('should generate questions with required fields', async () => {
      const result = await analyzer.analyze(validJD);
      result.questions.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('purpose');
        // keywords are optional - experience level questions may not have them
      });
    });

    it('should throw error for too short JD', async () => {
      await expect(analyzer.analyze('too short')).rejects.toThrow('too short');
    });

    it('should use fallback analysis if AI fails', async () => {
      const failingGemini = {
        getFlashModel: jest.fn(() => ({
          generateContent: jest.fn().mockRejectedValue(new Error('AI failed'))
        }))
      };
      const analyzerWithFailingAI = new JobDescriptionAnalyzer(failingGemini);

      const result = await analyzerWithFailingAI.analyze(validJD);

      expect(result.analysis).toHaveProperty('fallbackUsed', true);
      expect(result.analysis.jobTitle).toBeDefined();
      expect(result.questions).toHaveLength(5);
    });
  });

  describe('fallbackAnalysis', () => {
    it('should detect entry level positions', () => {
      const jd = 'Entry level software engineer. 0-2 years experience required.';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.experienceLevel).toBe('entry');
    });

    it('should detect senior level positions', () => {
      const jd = 'Senior engineer with 5+ years experience required.';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.experienceLevel).toBe('senior');
    });

    it('should detect executive level positions', () => {
      const jd = 'VP of Engineering position available.';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.experienceLevel).toBe('executive');
    });

    it('should extract common technical skills', () => {
      const jd = 'Must know JavaScript, Python, React, and SQL';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.requiredSkills.technical).toContain('javascript');
      expect(result.requiredSkills.technical).toContain('python');
      expect(result.requiredSkills.technical).toContain('react');
      expect(result.requiredSkills.technical).toContain('sql');
    });

    it('should detect remote work', () => {
      const jd = 'Remote position available';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.locationInfo.isRemote).toBe(true);
    });

    it('should detect hybrid work', () => {
      const jd = 'Hybrid work environment';
      const result = analyzer.fallbackAnalysis(jd);
      expect(result.locationInfo.isHybrid).toBe(true);
    });
  });

  describe('generateQuestions', () => {
    it('should generate technical question for technical roles', () => {
      const questions = analyzer.generateQuestions(mockGeminiAnalysis.analysis);
      const techQuestion = questions.find(q => q.id === 'jd_technical');
      expect(techQuestion).toBeDefined();
      expect(techQuestion.question).toContain('React');
    });

    it('should generate responsibility-based question', () => {
      const questions = analyzer.generateQuestions(mockGeminiAnalysis.analysis);
      const respQuestion = questions.find(q => q.id === 'jd_responsibility');
      expect(respQuestion).toBeDefined();
      expect(respQuestion.question).toContain('Design scalable systems');
    });

    it('should generate soft skill question', () => {
      const questions = analyzer.generateQuestions(mockGeminiAnalysis.analysis);
      const softSkillQ = questions.find(q => q.id === 'jd_soft_skill');
      expect(softSkillQ).toBeDefined();
      expect(softSkillQ.question).toContain('Leadership');
    });

    it('should include keywords for most questions', () => {
      const questions = analyzer.generateQuestions(mockGeminiAnalysis.analysis);
      // At least 3 questions should have keywords (technical, responsibility, soft skill)
      const questionsWithKeywords = questions.filter(q => q.keywords);
      expect(questionsWithKeywords.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getExperienceLevelQuestion', () => {
    it('should generate entry-level question', () => {
      const question = analyzer.getExperienceLevelQuestion('entry', 'Software Engineer');
      expect(question.id).toBe('jd_entry_growth');
      expect(question.question).toContain('academic projects');
    });

    it('should generate mid-level question', () => {
      const question = analyzer.getExperienceLevelQuestion('mid', 'Developer');
      expect(question.id).toBe('jd_mid_impact');
      expect(question.question).toContain('independently');
    });

    it('should generate senior-level question', () => {
      const question = analyzer.getExperienceLevelQuestion('senior', 'Engineer');
      expect(question.id).toBe('jd_senior_leadership');
      expect(question.question).toContain('mentored');
    });

    it('should generate executive-level question', () => {
      const question = analyzer.getExperienceLevelQuestion('executive', 'VP');
      expect(question.id).toBe('jd_exec_vision');
      expect(question.question).toContain('strategic');
    });

    it('should default to mid-level for unknown level', () => {
      const question = analyzer.getExperienceLevelQuestion('unknown', 'Engineer');
      expect(question.id).toBe('jd_mid_impact');
    });
  });

  describe('getCultureFitQuestion', () => {
    it('should generate innovation question for fast-paced, high-innovation companies', () => {
      const cultural = { workStyle: 'hybrid', pace: 'fast-paced', innovation: 'high' };
      const question = analyzer.getCultureFitQuestion(cultural, []);
      expect(question.purpose).toBe('adaptability_innovation');
      expect(question.question).toContain('innovation');
    });

    it('should generate collaboration question for collaborative workstyle', () => {
      const cultural = { workStyle: 'collaborative', pace: 'steady', innovation: 'medium' };
      const question = analyzer.getCultureFitQuestion(cultural, []);
      expect(question.purpose).toBe('teamwork_collaboration');
      expect(question.question.toLowerCase()).toContain('collaboration');
    });

    it('should generate detail-orientation question when trait is present', () => {
      const cultural = { workStyle: 'independent', pace: 'steady', innovation: 'low' };
      const traits = ['detail-oriented'];
      const question = analyzer.getCultureFitQuestion(cultural, traits);
      expect(question.purpose).toBe('detail_orientation');
      expect(question.question).toContain('detail');
    });

    it('should have follow-up question', () => {
      const cultural = { workStyle: 'collaborative', pace: 'steady', innovation: 'medium' };
      const question = analyzer.getCultureFitQuestion(cultural, []);
      expect(question.followUp).toBeDefined();
      expect(question.followUp.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // RESUME-FIRST GAP ANALYSIS TESTS (Session 22)
  // ========================================================================
  describe('Resume-First Gap Analysis (Session 22)', () => {
    const validJD = 'Senior Full-Stack Engineer with 5+ years React/Node.js, AWS deployment experience required';
    const juniorResume = `John Smith
Software Engineer
3 years experience with JavaScript
Built web features
Worked with team on various projects`;

    describe('analyze() with existingResume parameter', () => {
      test('should accept existingResume as second parameter', async () => {
        const result = await analyzer.analyze(validJD, juniorResume);

        expect(result.hasResume).toBe(true);
        expect(result.existingResume).toBe('provided');
      });

      test('should return resumeGapAnalysis section when resume provided', async () => {
        const result = await analyzer.analyze(validJD, juniorResume);

        const gapAnalysis = result.analysis.resumeGapAnalysis;
        expect(gapAnalysis).toBeDefined();
        expect(gapAnalysis.strengths).toBeInstanceOf(Array);
        expect(gapAnalysis.weaknesses).toBeInstanceOf(Array);
        expect(gapAnalysis.missingContent).toBeInstanceOf(Array);
        expect(gapAnalysis.atsMatchScore).toBeGreaterThanOrEqual(0);
        expect(gapAnalysis.atsMatchScore).toBeLessThanOrEqual(100);
        expect(gapAnalysis.questionCount).toBeGreaterThanOrEqual(2);
        expect(gapAnalysis.questionCount).toBeLessThanOrEqual(5);
      });

      test('should generate 2-5 questions when resume has gaps', async () => {
        const result = await analyzer.analyze(validJD, juniorResume);

        expect(result.questions.length).toBeGreaterThanOrEqual(2);
        expect(result.questions.length).toBeLessThanOrEqual(5);
        expect(result.generatedBy).toBe('gemini');
      });

      test('gap questions should have gapType field', async () => {
        const result = await analyzer.analyze(validJD, juniorResume);

        result.questions.forEach(question => {
          expect(question.gapType).toBeDefined();
          expect(['missing', 'weak', 'unquantified', 'comprehensive']).toContain(question.gapType);
        });
      });

      test('should treat resume < 100 chars as no resume', async () => {
        const tooShort = 'John Smith';  // < 100 characters

        const result = await analyzer.analyze(validJD, tooShort);

        // Should fallback to 5 questions like no resume
        expect(result.questions.length).toBe(5);
        expect(result.hasResume).toBe(false);
      });
    });

    describe('analyze() without resume (backwards compatibility)', () => {
      test('should generate exactly 5 comprehensive questions', async () => {
        const result = await analyzer.analyze(validJD);  // No resume parameter

        expect(result.questions.length).toBe(5);
        expect(result.hasResume).toBe(false);
        expect(result.analysis.resumeGapAnalysis.strengths).toEqual([]);
        expect(result.analysis.resumeGapAnalysis.weaknesses).toEqual([]);
      });

      test('should work exactly like before Session 22', async () => {
        const oldStyleResult = await analyzer.analyze(validJD);

        // Should have same structure as before
        expect(oldStyleResult.jobDescription).toBe(validJD);
        expect(oldStyleResult.analysis).toBeDefined();
        expect(oldStyleResult.questions).toHaveLength(5);
        expect(oldStyleResult.analyzedAt).toBeDefined();
      });
    });
  });
});
