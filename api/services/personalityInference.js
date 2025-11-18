/**
 * Personality Inference Algorithm
 * Extracts Big Five personality traits and work preferences from conversation
 * Phase 1: Rule-based keyword matching (will enhance with ML in Phase 2)
 */

/**
 * Big Five Personality Traits (0-100 scale)
 * - Openness: Creativity, curiosity, preference for novelty
 * - Conscientiousness: Organization, dependability, self-discipline
 * - Extraversion: Sociability, assertiveness, energy
 * - Agreeableness: Compassion, cooperation, trustworthiness
 * - Neuroticism: Emotional stability, resilience (LOW score = high stability)
 */

const PERSONALITY_KEYWORDS = {
  openness: {
    high: [
      'creative',
      'innovative',
      'curious',
      'new',
      'learn',
      'experiment',
      'explore',
      'idea',
      'change',
      'different',
      'unique',
      'unconventional',
      'artistic',
      'imaginative',
    ],
    low: [
      'traditional',
      'routine',
      'standard',
      'proven',
      'established',
      'conventional',
      'familiar',
      'consistent',
    ],
  },
  conscientiousness: {
    high: [
      'organized',
      'detail',
      'plan',
      'schedule',
      'thorough',
      'careful',
      'precise',
      'deadline',
      'checklist',
      'systematic',
      'prepared',
      'efficient',
      'meticulous',
      'disciplined',
    ],
    low: ['spontaneous', 'flexible', 'adapt', 'improvise', 'casual', 'relaxed'],
  },
  extraversion: {
    high: [
      'team',
      'collaborate',
      'people',
      'group',
      'social',
      'lead',
      'present',
      'network',
      'communicate',
      'energized',
      'outgoing',
      'interactive',
    ],
    low: [
      'independent',
      'alone',
      'quiet',
      'focus',
      'individual',
      'solo',
      'introverted',
      'reserved',
      'analytical',
    ],
  },
  agreeableness: {
    high: [
      'help',
      'support',
      'cooperate',
      'kind',
      'empathy',
      'considerate',
      'trust',
      'friendly',
      'compassionate',
      'understanding',
    ],
    low: ['competitive', 'direct', 'assertive', 'challenge', 'critical', 'independent'],
  },
  neuroticism: {
    high: ['stress', 'worry', 'anxious', 'nervous', 'pressure', 'overwhelm'],
    low: [
      'calm',
      'stable',
      'resilient',
      'confident',
      'composed',
      'steady',
      'relax',
      'handle',
      'overcome',
    ],
  },
};

/**
 * Work style indicators
 */
const WORK_STYLE_KEYWORDS = {
  collaborative: ['team', 'together', 'collaborate', 'group', 'others', 'we', 'collective'],
  independent: ['independently', 'alone', 'solo', 'myself', 'individual', 'own'],
};

/**
 * Leadership style indicators
 */
const LEADERSHIP_KEYWORDS = {
  servant: ['support', 'help', 'enable', 'empower', 'facilitate'],
  democratic: ['consensus', 'input', 'discuss', 'collaborate', 'participate'],
  transformational: ['inspire', 'vision', 'motivate', 'innovate', 'change'],
};

/**
 * Communication style indicators
 */
const COMMUNICATION_KEYWORDS = {
  direct: ['straightforward', 'clear', 'direct', 'concise', 'brief'],
  diplomatic: ['careful', 'considerate', 'tactful', 'sensitive', 'gentle'],
  analytical: ['data', 'facts', 'analyze', 'logic', 'evidence', 'metrics'],
  expressive: ['enthusiastic', 'passionate', 'energetic', 'storytelling'],
};

/**
 * Motivation type indicators
 */
const MOTIVATION_KEYWORDS = {
  achievement: ['goals', 'accomplish', 'succeed', 'win', 'achieve', 'excel', 'target'],
  autonomy: ['freedom', 'independent', 'control', 'flexibility', 'own'],
  mastery: ['learn', 'improve', 'master', 'expertise', 'skill', 'develop'],
  purpose: ['impact', 'meaning', 'help', 'contribute', 'mission', 'value'],
};

/**
 * Count keyword matches in text (case-insensitive)
 */
function countKeywordMatches(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
  }, 0);
}

/**
 * Calculate Big Five trait score (0-100)
 * Based on keyword frequency in conversation
 */
function calculateTraitScore(conversationText, traitKeywords) {
  const highMatches = countKeywordMatches(conversationText, traitKeywords.high);
  const lowMatches = countKeywordMatches(conversationText, traitKeywords.low);

  // Base score of 50 (neutral)
  // Each high match adds +5 points (max +50)
  // Each low match subtracts -5 points (max -50)
  const score = 50 + highMatches * 5 - lowMatches * 5;

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine work style preference
 */
function determineWorkStyle(conversationText) {
  const collaborativeScore = countKeywordMatches(
    conversationText,
    WORK_STYLE_KEYWORDS.collaborative
  );
  const independentScore = countKeywordMatches(
    conversationText,
    WORK_STYLE_KEYWORDS.independent
  );

  if (collaborativeScore > independentScore * 1.5) {
    return 'collaborative';
  } else if (independentScore > collaborativeScore * 1.5) {
    return 'independent';
  } else {
    return 'hybrid';
  }
}

/**
 * Determine leadership style
 */
function determineLeadershipStyle(conversationText) {
  const scores = {
    servant: countKeywordMatches(conversationText, LEADERSHIP_KEYWORDS.servant),
    democratic: countKeywordMatches(conversationText, LEADERSHIP_KEYWORDS.democratic),
    transformational: countKeywordMatches(
      conversationText,
      LEADERSHIP_KEYWORDS.transformational
    ),
  };

  // If no leadership indicators, return 'none'
  if (Object.values(scores).every((s) => s === 0)) {
    return 'none';
  }

  // Return highest scoring style
  return Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));
}

/**
 * Determine communication style
 */
function determineCommunicationStyle(conversationText) {
  const scores = {
    direct: countKeywordMatches(conversationText, COMMUNICATION_KEYWORDS.direct),
    diplomatic: countKeywordMatches(conversationText, COMMUNICATION_KEYWORDS.diplomatic),
    analytical: countKeywordMatches(conversationText, COMMUNICATION_KEYWORDS.analytical),
    expressive: countKeywordMatches(conversationText, COMMUNICATION_KEYWORDS.expressive),
  };

  return Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));
}

/**
 * Determine motivation type
 */
function determineMotivationType(conversationText) {
  const scores = {
    achievement: countKeywordMatches(conversationText, MOTIVATION_KEYWORDS.achievement),
    autonomy: countKeywordMatches(conversationText, MOTIVATION_KEYWORDS.autonomy),
    mastery: countKeywordMatches(conversationText, MOTIVATION_KEYWORDS.mastery),
    purpose: countKeywordMatches(conversationText, MOTIVATION_KEYWORDS.purpose),
  };

  return Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));
}

/**
 * Determine decision-making style based on Big Five traits
 */
function determineDecisionMaking(openness, conscientiousness) {
  if (conscientiousness > 70) {
    return 'analytical';
  } else if (openness > 70) {
    return 'intuitive';
  } else {
    return 'consultative';
  }
}

/**
 * Calculate confidence score based on conversation completeness
 * @param {number} messageCount - Number of user messages
 * @param {number} totalQuestions - Total questions asked
 * @returns {number} Confidence 0.0-1.0
 */
function calculateConfidence(messageCount, totalQuestions) {
  // More messages = higher confidence
  const completenessScore = Math.min(messageCount / totalQuestions, 1.0);

  // Base confidence: 0.6 for complete conversation, 0.3 for partial
  return 0.3 + completenessScore * 0.5;
}

/**
 * Main function: Infer personality traits from conversation
 * @param {Array} conversationHistory - Array of message objects {role, content}
 * @returns {Object} Personality traits and preferences
 */
function inferPersonality(conversationHistory) {
  // Combine all user messages into single text
  const conversationText = conversationHistory
    .filter((msg) => msg.messageRole === 'user')
    .map((msg) => msg.messageContent)
    .join(' ');

  // Calculate Big Five traits
  const openness = calculateTraitScore(conversationText, PERSONALITY_KEYWORDS.openness);
  const conscientiousness = calculateTraitScore(
    conversationText,
    PERSONALITY_KEYWORDS.conscientiousness
  );
  const extraversion = calculateTraitScore(conversationText, PERSONALITY_KEYWORDS.extraversion);
  const agreeableness = calculateTraitScore(
    conversationText,
    PERSONALITY_KEYWORDS.agreeableness
  );
  const neuroticism = calculateTraitScore(conversationText, PERSONALITY_KEYWORDS.neuroticism);

  // Derive work preferences
  const workStyle = determineWorkStyle(conversationText);
  const leadershipStyle = determineLeadershipStyle(conversationText);
  const communicationStyle = determineCommunicationStyle(conversationText);
  const motivationType = determineMotivationType(conversationText);
  const decisionMaking = determineDecisionMaking(openness, conscientiousness);

  // Calculate confidence
  const userMessageCount = conversationHistory.filter((msg) => msg.messageRole === 'user').length;
  const totalQuestions = 16; // Our framework has 16 base questions
  const confidence = calculateConfidence(userMessageCount, totalQuestions);

  return {
    // Big Five traits (0-100 scale)
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,

    // Derived work preferences
    workStyle, // 'collaborative', 'independent', 'hybrid'
    leadershipStyle, // 'servant', 'democratic', 'transformational', 'none'
    communicationStyle, // 'direct', 'diplomatic', 'analytical', 'expressive'
    motivationType, // 'achievement', 'autonomy', 'mastery', 'purpose'
    decisionMaking, // 'analytical', 'intuitive', 'consultative'

    // Metadata
    inferenceConfidence: confidence, // 0.0-1.0
    analysisVersion: '1.0',
  };
}

module.exports = {
  inferPersonality,
  calculateTraitScore,
  determineWorkStyle,
  determineLeadershipStyle,
  determineCommunicationStyle,
  determineMotivationType,
};
