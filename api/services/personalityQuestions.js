/**
 * Personality Questions Framework
 *
 * 6 questions designed to reveal Big Five personality traits through storytelling.
 * These questions are used AFTER the 5 JD-specific questions.
 *
 * Each question targets specific personality dimensions:
 * 1. Work Style (Conscientiousness + Agreeableness)
 * 2. Problem-Solving (Openness + Analytical thinking)
 * 3. Leadership/Influence (Extraversion + Agreeableness)
 * 4. Adaptability (Openness + Emotional Stability)
 * 5. Motivation (Intrinsic drivers + values)
 * 6. Communication Style (Extraversion + Agreeableness)
 */

const PERSONALITY_QUESTIONS = [
  {
    id: 'personality_work_style',
    order: 6,
    type: 'work_style',
    question: 'Describe your ideal work environment and approach. Do you thrive when working independently with deep focus, or do you prefer collaborative settings with frequent team interaction? Share an example that illustrates your preference.',
    purpose: 'Extract work style preferences and conscientiousness',
    traits: ['conscientiousness', 'extraversion', 'agreeableness'],
    keywords: {
      independent: ['alone', 'solo', 'autonomous', 'self-directed', 'focused', 'quiet'],
      collaborative: ['team', 'together', 'group', 'collaboration', 'partnership', 'meetings'],
      structured: ['organized', 'planned', 'scheduled', 'systematic', 'process'],
      flexible: ['adaptable', 'spontaneous', 'dynamic', 'fluid', 'changing']
    },
    followUp: 'What conditions help you do your best work?',
    minWords: 30
  },

  {
    id: 'personality_problem_solving',
    order: 7,
    type: 'problem_solving',
    question: 'Tell me about a complex problem you faced where the solution wasn\'t obvious. How did you approach it? Did you rely on proven methods, or did you experiment with new ideas? Walk me through your thought process.',
    purpose: 'Reveal openness to experience and analytical thinking',
    traits: ['openness', 'conscientiousness'],
    keywords: {
      analytical: ['analyzed', 'data', 'research', 'tested', 'measured', 'logical'],
      creative: ['innovate', 'creative', 'brainstorm', 'novel', 'unique', 'experiment'],
      methodical: ['step-by-step', 'systematic', 'process', 'framework', 'structured'],
      intuitive: ['instinct', 'feeling', 'sense', 'hunch', 'gut']
    },
    followUp: 'What did you learn from that experience that you still use today?',
    minWords: 40
  },

  {
    id: 'personality_leadership',
    order: 8,
    type: 'leadership',
    question: 'Describe a situation where you influenced others or took the lead on an initiative (formal or informal). How did you get people on board? What was your approach to gaining buy-in?',
    purpose: 'Assess leadership style and extraversion',
    traits: ['extraversion', 'agreeableness', 'conscientiousness'],
    keywords: {
      directive: ['told', 'directed', 'instructed', 'assigned', 'decided'],
      collaborative: ['asked', 'listened', 'involved', 'consensus', 'together', 'facilitated'],
      persuasive: ['convinced', 'explained', 'demonstrated', 'showed', 'persuaded'],
      supportive: ['helped', 'supported', 'encouraged', 'mentored', 'coached']
    },
    followUp: 'How did people respond to your leadership style?',
    minWords: 35
  },

  {
    id: 'personality_adaptability',
    order: 9,
    type: 'adaptability',
    question: 'Share an example of a time when plans changed unexpectedly or you faced significant uncertainty. How did you react? What helped you navigate the situation?',
    purpose: 'Measure emotional stability and openness to change',
    traits: ['neuroticism', 'openness', 'conscientiousness'],
    keywords: {
      calm: ['calm', 'composed', 'steady', 'unflappable', 'level-headed'],
      anxious: ['stressed', 'worried', 'concerned', 'anxious', 'nervous'],
      proactive: ['immediately', 'quickly', 'action', 'decisive', 'took charge'],
      reactive: ['waited', 'observed', 'monitored', 'cautious', 'careful']
    },
    followUp: 'Looking back, what would you do differently, if anything?',
    minWords: 30
  },

  {
    id: 'personality_motivation',
    order: 10,
    type: 'motivation',
    question: 'Think about a project or accomplishment you\'re genuinely proud of. What made it meaningful to you? Was it the recognition, the challenge, the impact on others, or something else?',
    purpose: 'Understand intrinsic motivators and values',
    traits: ['openness', 'conscientiousness'],
    keywords: {
      achievement: ['accomplish', 'achieve', 'succeed', 'win', 'excel', 'best'],
      recognition: ['recognition', 'praise', 'acknowledged', 'noticed', 'credit'],
      impact: ['impact', 'difference', 'helped', 'improved', 'benefited'],
      mastery: ['learn', 'master', 'skill', 'grow', 'develop', 'challenge'],
      autonomy: ['control', 'freedom', 'independence', 'ownership', 'my own']
    },
    followUp: 'What drives you to do your best work?',
    minWords: 25
  },

  {
    id: 'personality_communication',
    order: 11,
    type: 'communication',
    question: 'Describe how you typically communicate important information or ideas. Do you prefer detailed explanations, concise summaries, visual presentations, or casual conversations? Share an example of when your communication style made a difference.',
    purpose: 'Identify communication style and preferences',
    traits: ['extraversion', 'agreeableness', 'conscientiousness'],
    keywords: {
      detailed: ['detail', 'thorough', 'comprehensive', 'complete', 'in-depth'],
      concise: ['brief', 'concise', 'summary', 'quick', 'to-the-point', 'efficient'],
      visual: ['visual', 'diagram', 'chart', 'presentation', 'show', 'demo'],
      verbal: ['talk', 'discuss', 'conversation', 'meeting', 'call', 'speaking'],
      written: ['write', 'email', 'document', 'memo', 'report']
    },
    followUp: 'How do you adjust your communication style for different audiences?',
    minWords: 30
  }
];

/**
 * Get all 6 personality questions in order
 */
function getPersonalityQuestions() {
  return PERSONALITY_QUESTIONS.sort((a, b) => a.order - b.order);
}

/**
 * Get question by ID
 */
function getQuestionById(id) {
  return PERSONALITY_QUESTIONS.find(q => q.id === id);
}

/**
 * Validate answer length
 */
function validateAnswer(questionId, answer) {
  const question = getQuestionById(questionId);
  if (!question) {
    return { valid: false, error: 'Invalid question ID' };
  }

  const wordCount = answer.trim().split(/\s+/).length;

  if (wordCount < question.minWords) {
    return {
      valid: false,
      error: `Please provide more detail. We need at least ${question.minWords} words to understand your experience (you wrote ${wordCount} words).`
    };
  }

  if (wordCount > 500) {
    return {
      valid: false,
      error: 'Please keep your answer under 500 words. Focus on the most important details.'
    };
  }

  return { valid: true };
}

/**
 * Generate hint text for a question
 */
function getQuestionHint(questionId) {
  const hints = {
    personality_work_style: 'Think about: When do you feel most productive? What distracts you? Do you energize from people or need quiet time?',
    personality_problem_solving: 'Think about: What was the problem? What approaches did you consider? What helped you break through?',
    personality_leadership: 'Think about: Was this formal or informal leadership? How did you communicate your vision? What obstacles did you overcome?',
    personality_adaptability: 'Think about: What changed? How did you feel initially? What actions did you take? What was the outcome?',
    personality_motivation: 'Think about: Why did this matter to you personally? What made you invest extra effort? How did you feel when it was done?',
    personality_communication: 'Think about: What was the situation? Who was your audience? How did you structure your message? What was the result?'
  };

  return hints[questionId] || 'Share a specific example with concrete details.';
}

/**
 * Get follow-up question based on answer analysis
 */
function getFollowUpQuestion(questionId, answer) {
  const question = getQuestionById(questionId);
  if (!question) return null;

  const answerLower = answer.toLowerCase();

  // Check if answer is too vague (lacks specifics)
  const hasMetrics = /\d+/.test(answer); // Contains numbers
  const hasSpecifics = answerLower.includes('specifically') ||
                       answerLower.includes('for example') ||
                       answerLower.includes('resulted in');

  if (!hasMetrics && !hasSpecifics && questionId !== 'personality_motivation') {
    return 'Can you provide more specific details or quantifiable results?';
  }

  // Return the default follow-up
  return question.followUp;
}

/**
 * Combine JD questions + personality questions into full conversation
 */
function buildFullConversation(jdQuestions) {
  // Steps 1-6: JD questions (5 questions + 1 intro)
  const conversationSteps = [
    {
      step: 1,
      type: 'job_description',
      question: null, // This is the JD input step
      title: 'Job Description',
      instruction: 'Paste the full job description for the position you\'re targeting.',
      required: true
    }
  ];

  // Add JD-specific questions (steps 2-6)
  jdQuestions.forEach((jdQ, index) => {
    conversationSteps.push({
      step: index + 2,
      type: 'jd_specific',
      questionId: jdQ.id,
      question: jdQ.question,
      title: `Experience #${index + 1}`,
      purpose: jdQ.purpose,
      keywords: jdQ.keywords,
      followUp: jdQ.followUp,
      required: true,
      minWords: 30
    });
  });

  // Add personality questions (steps 7-12)
  const personalityQs = getPersonalityQuestions();
  personalityQs.forEach((pQ, index) => {
    conversationSteps.push({
      step: pQ.order + 1, // +1 because JD input is step 1
      type: 'personality',
      questionId: pQ.id,
      question: pQ.question,
      title: pQ.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      purpose: pQ.purpose,
      traits: pQ.traits,
      keywords: pQ.keywords,
      followUp: pQ.followUp,
      hint: getQuestionHint(pQ.id),
      required: true,
      minWords: pQ.minWords
    });
  });

  // Step 13: AI Processing
  conversationSteps.push({
    step: 13,
    type: 'processing',
    question: null,
    title: 'Analyzing Your Profile',
    instruction: 'Our AI is analyzing your experiences and personality to craft your perfect resume...',
    required: false
  });

  return conversationSteps;
}

module.exports = {
  PERSONALITY_QUESTIONS,
  getPersonalityQuestions,
  getQuestionById,
  validateAnswer,
  getQuestionHint,
  getFollowUpQuestion,
  buildFullConversation
};
