/**
 * MOCK DATA STORE
 * Used when REACT_APP_USE_MOCK_DATA=true
 * Allows frontend development without backend dependencies.
 */

export const mockResumes = [
  {
    id: 'mock-resume-1',
    title: 'Software Engineer Resume',
    createdAt: new Date().toISOString(),
    preview: 'Experienced Software Engineer with a focus on React...'
  },
  {
    id: 'mock-resume-2',
    title: 'Product Manager Resume',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    preview: 'Product Manager with 5 years of experience...'
  }
];

export const mockConversation = {
  start: {
    sessionId: 'mock-session-123',
    questionsType: 'jd-specific',
    jobTitle: 'Mock Job Title',
    currentQuestion: {
      id: 1,
      text: 'What was your most challenging project?',
      category: 'Experience'
    },
    progress: { current: 0, total: 3, percentage: 0 }
  },
  message: {
    success: true,
    isComplete: false,
    nextQuestion: {
      id: 2,
      text: 'How do you handle conflict?',
      category: 'Behavioral'
    },
    progress: { current: 1, total: 3, percentage: 33 }
  },
  complete: {
    isComplete: true,
    personality: {
      openness: 0.8,
      conscientiousness: 0.9,
      extraversion: 0.5,
      agreeableness: 0.7,
      neuroticism: 0.2
    }
  }
};

export const mockGeneration = {
  resumeId: 'mock-new-resume-999',
  usage: {
    resumesGenerated: 5,
    resumesLimit: 10,
    remaining: 5
  }
};
