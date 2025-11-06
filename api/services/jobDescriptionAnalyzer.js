/**
 * Job Description Analyzer Service
 *
 * Analyzes job descriptions to extract:
 * - Required skills and technologies
 * - Experience level (entry/mid/senior)
 * - Key responsibilities
 * - Soft skills and personality traits
 * - Company culture indicators
 *
 * Used to generate targeted, job-specific questions for conversational resume building.
 */

class JobDescriptionAnalyzer {
  constructor(geminiService) {
    this.gemini = geminiService;
  }

  /**
   * Main analysis method
   * @param {string} jobDescription - Raw job description text
   * @returns {Promise<Object>} Analyzed JD data
   */
  async analyze(jobDescription) {
    if (!jobDescription || jobDescription.trim().length < 50) {
      throw new Error('Job description is too short (minimum 50 characters)');
    }

    // Use Gemini to deeply analyze the JD
    const analysis = await this.analyzeWithAI(jobDescription);

    // Generate targeted questions based on analysis
    const questions = this.generateQuestions(analysis);

    return {
      jobDescription,
      analysis,
      questions,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Use Gemini AI to analyze job description
   */
  async analyzeWithAI(jobDescription) {
    const prompt = `You are an expert career coach and job market analyst. Analyze this job description and extract structured information.

**JOB DESCRIPTION:**
${jobDescription}

**EXTRACT THE FOLLOWING (respond in JSON format):**

{
  "jobTitle": "Exact job title from posting",
  "company": "Company name (or 'Not specified' if not mentioned)",
  "experienceLevel": "entry|mid|senior|executive",
  "requiredSkills": {
    "technical": ["List of hard skills, technologies, tools"],
    "soft": ["Communication", "Leadership", etc.],
    "certifications": ["Any required certifications"]
  },
  "keyResponsibilities": ["Top 5 most important responsibilities"],
  "culturalIndicators": {
    "workStyle": "collaborative|independent|hybrid",
    "pace": "fast-paced|steady|flexible",
    "innovation": "high|medium|low (how much they emphasize innovation)"
  },
  "educationRequired": "Degree requirements",
  "locationInfo": {
    "location": "City/State or 'Remote'",
    "isRemote": true|false,
    "isHybrid": true|false
  },
  "salaryRange": {
    "min": 0,
    "max": 0,
    "currency": "USD",
    "disclosed": false
  },
  "topKeywords": ["Most important keywords for ATS (top 10)"],
  "personalityTraits": ["Traits they're looking for: Adaptable, Detail-oriented, etc."]
}

**INSTRUCTIONS:**
- Be precise - extract exactly what's in the JD
- For missing info, use "Not specified" or null
- Technical skills: Include programming languages, frameworks, tools
- Soft skills: Leadership, communication, problem-solving, etc.
- Keywords: Words that should appear in resume for ATS matching
- Personality traits: Infer from language like "self-starter", "team player", "detail-oriented"

Respond ONLY with valid JSON (no markdown formatting).`;

    try {
      const model = this.gemini.getFlashModel(); // Fast model for analysis
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Parse JSON response
      let cleanedResponse = responseText.trim();
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const analysis = JSON.parse(cleanedResponse);

      // Validate required fields
      if (!analysis.jobTitle || !analysis.requiredSkills || !analysis.keyResponsibilities) {
        throw new Error('AI analysis missing required fields');
      }

      return analysis;

    } catch (error) {
      console.error('AI analysis failed:', error);

      // Fallback: Basic keyword extraction
      return this.fallbackAnalysis(jobDescription);
    }
  }

  /**
   * Fallback analysis if AI fails (regex-based)
   */
  fallbackAnalysis(jobDescription) {
    const text = jobDescription.toLowerCase();

    // Detect experience level
    let experienceLevel = 'mid';
    if (text.includes('entry') || text.includes('junior') || text.includes('0-2 years')) {
      experienceLevel = 'entry';
    } else if (text.includes('senior') || text.includes('lead') || text.includes('5+ years')) {
      experienceLevel = 'senior';
    } else if (text.includes('director') || text.includes('vp') || text.includes('executive')) {
      experienceLevel = 'executive';
    }

    // Extract technical skills (common technologies)
    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
      'kubernetes', 'git', 'api', 'rest', 'graphql', 'typescript', 'html', 'css',
      'mongodb', 'postgresql', 'redis', 'linux', 'ci/cd', 'agile', 'scrum'
    ];
    const technical = techKeywords.filter(skill => text.includes(skill));

    // Extract soft skills
    const softSkillKeywords = [
      'communication', 'leadership', 'teamwork', 'problem-solving', 'analytical',
      'detail-oriented', 'self-motivated', 'collaborative', 'creative', 'adaptable'
    ];
    const soft = softSkillKeywords.filter(skill => text.includes(skill));

    // Detect remote/hybrid
    const isRemote = text.includes('remote') || text.includes('work from home');
    const isHybrid = text.includes('hybrid');

    return {
      jobTitle: 'Position (extracted from JD)',
      company: 'Not specified',
      experienceLevel,
      requiredSkills: {
        technical: technical.length > 0 ? technical : ['Not specified'],
        soft: soft.length > 0 ? soft : ['Communication', 'Problem-solving'],
        certifications: []
      },
      keyResponsibilities: [
        'Extracted from job description (AI analysis unavailable)'
      ],
      culturalIndicators: {
        workStyle: 'collaborative',
        pace: 'steady',
        innovation: 'medium'
      },
      educationRequired: 'Not specified',
      locationInfo: {
        location: 'Not specified',
        isRemote,
        isHybrid
      },
      salaryRange: {
        min: 0,
        max: 0,
        currency: 'USD',
        disclosed: false
      },
      topKeywords: [...technical, ...soft].slice(0, 10),
      personalityTraits: soft,
      fallbackUsed: true
    };
  }

  /**
   * Generate 5 JD-specific questions based on analysis
   */
  generateQuestions(analysis) {
    const questions = [];

    // Question 1: Technical skills (if technical role)
    if (analysis.requiredSkills.technical.length > 0) {
      const topTechs = analysis.requiredSkills.technical.slice(0, 3).join(', ');
      questions.push({
        id: 'jd_technical',
        type: 'experience',
        question: `This role requires experience with ${topTechs}. Tell me about a project where you used these technologies to solve a challenging problem. What was the outcome?`,
        purpose: 'technical_validation',
        keywords: analysis.requiredSkills.technical,
        followUp: 'What specific results or metrics came from this project?'
      });
    } else {
      questions.push({
        id: 'jd_experience',
        type: 'experience',
        question: `Tell me about your most relevant professional experience that relates to this ${analysis.jobTitle} position. What were your key accomplishments?`,
        purpose: 'experience_validation',
        keywords: analysis.topKeywords,
        followUp: 'Can you quantify the impact you made?'
      });
    }

    // Question 2: Key responsibility
    if (analysis.keyResponsibilities.length > 0) {
      const topResponsibility = analysis.keyResponsibilities[0];
      questions.push({
        id: 'jd_responsibility',
        type: 'achievement',
        question: `A key responsibility in this role is: "${topResponsibility}". Describe a time when you successfully handled a similar responsibility. What was your approach?`,
        purpose: 'responsibility_match',
        keywords: analysis.topKeywords,
        followUp: 'What obstacles did you overcome, and what was the result?'
      });
    }

    // Question 3: Soft skill match
    const topSoftSkill = analysis.requiredSkills.soft[0] || 'problem-solving';
    questions.push({
      id: 'jd_soft_skill',
      type: 'behavioral',
      question: `This position requires strong ${topSoftSkill} skills. Share an example that demonstrates your ${topSoftSkill} abilities in a professional setting.`,
      purpose: 'soft_skill_validation',
      keywords: analysis.requiredSkills.soft,
      followUp: 'How did your team or organization benefit from your approach?'
    });

    // Question 4: Experience level match
    const experienceQuestion = this.getExperienceLevelQuestion(analysis.experienceLevel, analysis.jobTitle);
    questions.push(experienceQuestion);

    // Question 5: Cultural fit / personality
    const cultureQuestion = this.getCultureFitQuestion(analysis.culturalIndicators, analysis.personalityTraits);
    questions.push(cultureQuestion);

    return questions;
  }

  /**
   * Generate experience-level specific question
   */
  getExperienceLevelQuestion(level, jobTitle) {
    const questions = {
      entry: {
        id: 'jd_entry_growth',
        type: 'growth',
        question: `As you're starting your career as a ${jobTitle}, what academic projects, internships, or personal initiatives have prepared you for this role? What did you learn?`,
        purpose: 'entry_validation',
        followUp: 'How do you plan to apply this learning to the role?'
      },
      mid: {
        id: 'jd_mid_impact',
        type: 'impact',
        question: `With your experience level, you'll be expected to deliver results independently. Tell me about a time you owned a project from start to finish. What was the impact?`,
        purpose: 'mid_validation',
        followUp: 'What would you do differently if you could do it again?'
      },
      senior: {
        id: 'jd_senior_leadership',
        type: 'leadership',
        question: `Senior ${jobTitle} roles require both technical excellence and leadership. Describe a situation where you mentored others or led a strategic initiative. What was the outcome?`,
        purpose: 'senior_validation',
        followUp: 'How did you measure success, and what did your team learn?'
      },
      executive: {
        id: 'jd_exec_vision',
        type: 'strategic',
        question: `Executive-level ${jobTitle} positions require strategic vision and organizational impact. Share an example of how you've driven company-wide change or built something from the ground up.`,
        purpose: 'executive_validation',
        followUp: 'What was the business impact, and how did you get stakeholder buy-in?'
      }
    };

    return questions[level] || questions.mid;
  }

  /**
   * Generate culture-fit question based on company indicators
   */
  getCultureFitQuestion(cultural, traits) {
    const { workStyle, pace, innovation } = cultural;

    let question = '';
    let purpose = 'culture_fit';

    if (pace === 'fast-paced' && innovation === 'high') {
      question = `This company values innovation and moves quickly. Tell me about a time you had to learn something new rapidly or pivot on a project with changing requirements. How did you adapt?`;
      purpose = 'adaptability_innovation';
    } else if (workStyle === 'collaborative') {
      question = `Collaboration is key in this role. Describe a situation where you worked with a cross-functional team to achieve a goal. What was your specific contribution?`;
      purpose = 'teamwork_collaboration';
    } else if (traits.includes('detail-oriented') || traits.includes('analytical')) {
      question = `This role requires meticulous attention to detail. Share an example where your careful analysis or thoroughness prevented a problem or improved an outcome.`;
      purpose = 'detail_orientation';
    } else {
      question = `Every company has a unique culture. What type of work environment brings out your best work, and why do you think you'd thrive in this ${workStyle} setting?`;
      purpose = 'work_preference';
    }

    return {
      id: 'jd_culture_fit',
      type: 'culture',
      question,
      purpose,
      keywords: traits,
      followUp: 'What did you learn about yourself from that experience?'
    };
  }

  /**
   * Quick validation of job description quality
   */
  validateJobDescription(jobDescription) {
    const text = jobDescription.trim();

    if (text.length < 50) {
      return { valid: false, reason: 'Job description is too short (minimum 50 characters)' };
    }

    if (text.length > 20000) {
      return { valid: false, reason: 'Job description is too long (maximum 20,000 characters)' };
    }

    // Check if it looks like a real JD (has at least some job-related keywords)
    const jobKeywords = [
      'experience', 'skills', 'responsibilities', 'requirements', 'qualifications',
      'role', 'position', 'team', 'work', 'candidate', 'seeking', 'looking for'
    ];

    const lowerText = text.toLowerCase();
    const hasKeywords = jobKeywords.some(keyword => lowerText.includes(keyword));

    if (!hasKeywords) {
      return {
        valid: false,
        reason: 'This doesn\'t appear to be a job description. Please paste the full job posting.'
      };
    }

    return { valid: true };
  }
}

module.exports = JobDescriptionAnalyzer;
