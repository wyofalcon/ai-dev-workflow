/**
 * Conversational Profile Builder - Question Framework
 * 15-20 questions across 5 categories for personality inference
 */

const QUESTION_CATEGORIES = {
  CAREER_FOUNDATION: 'Career Foundation',
  ACHIEVEMENT_STORIES: 'Achievement Stories',
  WORK_STYLE: 'Work Style & Environment',
  PERSONAL_INSIGHTS: 'Personal Insights',
  VALUES_MOTIVATION: 'Values & Motivation',
};

const QUESTIONS = [
  // CATEGORY 1: Career Foundation (4 questions)
  {
    id: 'career_1',
    category: QUESTION_CATEGORIES.CAREER_FOUNDATION,
    questionText: "Let's start with the basics! What's your current job title or most recent position?",
    purpose: 'Extract current title, company, role',
    followUp: null,
    order: 1,
  },
  {
    id: 'career_2',
    category: QUESTION_CATEGORIES.CAREER_FOUNDATION,
    questionText: "Great! How long have you been working in this field, and what are your main responsibilities?",
    purpose: 'Extract years of experience, key skills',
    followUp: null,
    order: 2,
  },
  {
    id: 'career_3',
    category: QUESTION_CATEGORIES.CAREER_FOUNDATION,
    questionText: "What kind of role are you looking for next? (e.g., similar position, promotion, career change)",
    purpose: 'Extract target role, career goals',
    followUp: null,
    order: 3,
  },
  {
    id: 'career_4',
    category: QUESTION_CATEGORIES.CAREER_FOUNDATION,
    questionText: "Tell me about your educational background - what degrees, certifications, or training do you have?",
    purpose: 'Extract education, certifications',
    followUp: null,
    order: 4,
  },

  // CATEGORY 2: Achievement Stories (3 questions)
  {
    id: 'achievement_1',
    category: QUESTION_CATEGORIES.ACHIEVEMENT_STORIES,
    questionText: "Now let's talk about your wins! Describe a project or accomplishment you're really proud of. What did you do and what was the impact?",
    purpose: 'Extract achievement story, quantifiable results, personality traits (conscientiousness, openness)',
    followUp: "That's impressive! What made this project challenging, and how did you overcome those challenges?",
    order: 5,
  },
  {
    id: 'achievement_2',
    category: QUESTION_CATEGORIES.ACHIEVEMENT_STORIES,
    questionText: "Tell me about a time you had to learn something completely new to solve a problem. How did you approach it?",
    purpose: 'Assess openness to experience, learning agility, problem-solving style',
    followUp: null,
    order: 6,
  },
  {
    id: 'achievement_3',
    category: QUESTION_CATEGORIES.ACHIEVEMENT_STORIES,
    questionText: "Describe a situation where you had to work with others to achieve a goal. What was your role?",
    purpose: 'Assess extraversion, agreeableness, teamwork style',
    followUp: null,
    order: 7,
  },

  // CATEGORY 3: Work Style & Environment (3 questions)
  {
    id: 'workstyle_1',
    category: QUESTION_CATEGORIES.WORK_STYLE,
    questionText: "How do you prefer to work - independently, collaboratively, or a mix of both? Give me an example.",
    purpose: 'Assess work style preference (collaborative/independent/hybrid)',
    followUp: null,
    order: 8,
  },
  {
    id: 'workstyle_2',
    category: QUESTION_CATEGORIES.WORK_STYLE,
    questionText: "When you have multiple deadlines, how do you organize and prioritize your work?",
    purpose: 'Assess conscientiousness, organizational skills, decision-making style',
    followUp: null,
    order: 9,
  },
  {
    id: 'workstyle_3',
    category: QUESTION_CATEGORIES.WORK_STYLE,
    questionText: "Describe your ideal work environment. What helps you do your best work?",
    purpose: 'Assess environmental preferences, personality traits',
    followUp: null,
    order: 10,
  },

  // CATEGORY 4: Personal Insights (3 questions)
  {
    id: 'personal_1',
    category: QUESTION_CATEGORIES.PERSONAL_INSIGHTS,
    questionText: "What do colleagues or managers most often compliment you on?",
    purpose: 'Extract soft skills, strengths',
    followUp: null,
    order: 11,
  },
  {
    id: 'personal_2',
    category: QUESTION_CATEGORIES.PERSONAL_INSIGHTS,
    questionText: "Think about a mistake or setback you experienced. What did you learn from it?",
    purpose: 'Assess neuroticism (emotional stability), growth mindset, resilience',
    followUp: null,
    order: 12,
  },
  {
    id: 'personal_3',
    category: QUESTION_CATEGORIES.PERSONAL_INSIGHTS,
    questionText: "When faced with a tough decision, do you rely more on data and analysis, or gut feeling and intuition?",
    purpose: 'Assess decision-making style (analytical vs intuitive)',
    followUp: null,
    order: 13,
  },

  // CATEGORY 5: Values & Motivation (3 questions)
  {
    id: 'values_1',
    category: QUESTION_CATEGORIES.VALUES_MOTIVATION,
    questionText: "What motivates you most at work? (e.g., solving problems, helping others, learning new things, achieving goals)",
    purpose: 'Assess motivation type (achievement, autonomy, mastery, purpose)',
    followUp: null,
    order: 14,
  },
  {
    id: 'values_2',
    category: QUESTION_CATEGORIES.VALUES_MOTIVATION,
    questionText: "Describe a time when you went above and beyond what was required. What drove you to do that?",
    purpose: 'Assess conscientiousness, intrinsic motivation',
    followUp: null,
    order: 15,
  },
  {
    id: 'values_3',
    category: QUESTION_CATEGORIES.VALUES_MOTIVATION,
    questionText: "Looking ahead 5 years, where do you see yourself professionally? What's your ultimate career goal?",
    purpose: 'Extract career aspirations, ambition level',
    followUp: null,
    order: 16,
  },

  // BONUS QUESTIONS (Optional - triggered based on responses)
  {
    id: 'bonus_leadership',
    category: QUESTION_CATEGORIES.WORK_STYLE,
    questionText: "Have you ever led a team or mentored others? Tell me about that experience.",
    purpose: 'Assess leadership style, extraversion',
    followUp: null,
    order: 17,
    conditional: true, // Only ask if user mentions leadership
  },
  {
    id: 'bonus_technical',
    category: QUESTION_CATEGORIES.CAREER_FOUNDATION,
    questionText: "What technical skills or tools are you most proficient in?",
    purpose: 'Extract technical skills list',
    followUp: null,
    order: 18,
    conditional: true, // Only ask for technical roles
  },
];

/**
 * Get next question based on current progress
 * @param {number} currentQuestionIndex - Index of last answered question (0-based)
 * @param {Object} conversationContext - Context for conditional questions
 * @returns {Object|null} Next question or null if complete
 */
function getNextQuestion(currentQuestionIndex, conversationContext = {}) {
  // Get base questions (non-conditional)
  const baseQuestions = QUESTIONS.filter((q) => !q.conditional);

  // If we've completed all base questions, return null
  if (currentQuestionIndex >= baseQuestions.length - 1) {
    return null;
  }

  return baseQuestions[currentQuestionIndex + 1];
}

/**
 * Get question by ID
 */
function getQuestionById(questionId) {
  return QUESTIONS.find((q) => q.id === questionId);
}

/**
 * Get total number of base questions
 */
function getTotalQuestions() {
  return QUESTIONS.filter((q) => !q.conditional).length;
}

/**
 * Get progress percentage
 */
function getProgress(currentQuestionIndex) {
  const total = getTotalQuestions();
  return Math.round(((currentQuestionIndex + 1) / total) * 100);
}

module.exports = {
  QUESTION_CATEGORIES,
  QUESTIONS,
  getNextQuestion,
  getQuestionById,
  getTotalQuestions,
  getProgress,
};
