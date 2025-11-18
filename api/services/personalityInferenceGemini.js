/**
 * Gemini-Based Big 5 Personality Inference
 * Replaces keyword-matching with AI-powered psychological analysis
 */

const geminiService = require('./geminiServiceVertex');

/**
 * Build Big 5 analysis prompt for Gemini
 * @param {Array} conversationMessages - User's answers to personality questions
 * @returns {string} Prompt for Gemini
 */
function buildBig5Prompt(conversationMessages) {
  const userAnswers = conversationMessages
    .filter(msg => msg.role === 'user')
    .map((msg, idx) => `Answer ${idx + 1}: ${msg.content}`)
    .join('\n\n');

  return `You are an expert organizational psychologist specializing in the Big Five personality trait assessment.

**YOUR TASK:**
Analyze the following conversation answers and infer the user's Big Five personality traits with high accuracy.

**CONVERSATION ANSWERS:**
${userAnswers}

**BIG FIVE PERSONALITY TRAITS (Respond with scores 0-100):**

1. **OPENNESS TO EXPERIENCE** (0-100)
   - HIGH: Creative, curious, imaginative, prefers novelty, open to new ideas
   - LOW: Practical, conventional, prefers routine, values tradition
   - Look for: Innovation, learning, experimentation, artistic interests, embracing change

2. **CONSCIENTIOUSNESS** (0-100)
   - HIGH: Organized, disciplined, detail-oriented, reliable, plans ahead
   - LOW: Spontaneous, flexible, casual, improvises
   - Look for: Planning, organization, thoroughness, meeting deadlines, systematic approach

3. **EXTRAVERSION** (0-100)
   - HIGH: Outgoing, energized by people, assertive, talkative, sociable
   - LOW: Reserved, energized by solitude, thoughtful, prefers small groups
   - Look for: Teamwork vs independent work, social energy, leadership, communication style

4. **AGREEABLENESS** (0-100)
   - HIGH: Cooperative, compassionate, trusting, helpful, empathetic
   - LOW: Competitive, direct, skeptical, assertive, independent
   - Look for: Helping others, cooperation, conflict resolution, empathy

5. **NEUROTICISM** (0-100)
   - HIGH: Experiences stress/anxiety frequently, emotionally reactive, worries
   - LOW: Calm, emotionally stable, resilient, handles pressure well
   - Look for: Handling setbacks, stress management, emotional stability, confidence
   - NOTE: LOWER score = better emotional stability (reverse-scored trait)

**DERIVED WORK PREFERENCES:**

6. **Work Style:** Based on Extraversion and Agreeableness
   - Options: "collaborative" | "independent" | "hybrid"

7. **Leadership Style:** Based on Extraversion, Openness, Agreeableness
   - Options: "servant" (supportive) | "democratic" (consensus-driven) | "transformational" (visionary) | "none"

8. **Communication Style:** Based on Extraversion, Agreeableness, Conscientiousness
   - Options: "direct" | "diplomatic" | "analytical" | "expressive"

9. **Motivation Type:** Based on all Big 5 traits
   - Options: "achievement" (goals/success) | "autonomy" (freedom/control) | "mastery" (learning/expertise) | "purpose" (impact/meaning)

10. **Decision Making:** Based on Openness and Conscientiousness
    - Options: "analytical" (data-driven) | "intuitive" (gut-feeling) | "consultative" (seeks input)

**CONFIDENCE SCORE:**
Rate your confidence in this assessment (0.0-1.0) based on:
- Depth and detail of user's answers
- Consistency across responses
- Number of behavioral examples provided

**RESPOND IN THIS EXACT JSON FORMAT:**
{
  "bigFive": {
    "openness": 75,
    "conscientiousness": 82,
    "extraversion": 45,
    "agreeableness": 68,
    "neuroticism": 35
  },
  "derivedTraits": {
    "workStyle": "hybrid",
    "leadershipStyle": "democratic",
    "communicationStyle": "analytical",
    "motivationType": "mastery",
    "decisionMaking": "consultative"
  },
  "confidence": 0.85,
  "reasoning": {
    "openness": "User shows strong learning orientation and embraces new challenges",
    "conscientiousness": "Highly organized, mentions planning and systematic approach repeatedly",
    "extraversion": "Prefers independent work but comfortable collaborating when needed",
    "agreeableness": "Demonstrates empathy and teamwork, mentions helping colleagues",
    "neuroticism": "Handles setbacks calmly, shows resilience (low score = high stability)"
  },
  "keyInsights": [
    "Detail-oriented professional who values both expertise and collaboration",
    "Thrives in structured environments with opportunities for growth",
    "Natural problem-solver with analytical mindset"
  ]
}

**CRITICAL INSTRUCTIONS:**
1. Base scores ONLY on evidence from the user's actual answers
2. If insufficient data for a trait, default to 50 (neutral) and note low confidence
3. Provide brief reasoning for each Big 5 score
4. Be psychologically accurate - don't over-interpret limited data
5. Return ONLY valid JSON (no markdown, no code blocks)

Analyze now:`;
}

/**
 * Infer personality using Gemini AI
 * @param {Array} conversationMessages - Array of {role: 'user'|'assistant', content: string}
 * @returns {Promise<Object>} Big Five traits and derived preferences
 */
async function inferPersonalityWithGemini(conversationMessages) {
  try {
    const prompt = buildBig5Prompt(conversationMessages);

    console.log('🧠 Analyzing personality with Gemini...');

    const model = geminiService.getFlashModel();
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Handle Vertex AI response format
    let responseText;
    if (typeof response.text === 'function') {
      responseText = response.text();
    } else if (response.candidates && response.candidates[0]) {
      responseText = response.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected Gemini response format');
    }

    console.log('🤖 Gemini response (first 200 chars):', responseText.substring(0, 200));

    // Clean and parse JSON
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const analysis = JSON.parse(cleanedResponse);

    // Validate response structure
    if (!analysis.bigFive || !analysis.derivedTraits) {
      throw new Error('Invalid Gemini response structure');
    }

    // Flatten for database storage (matches personality_traits schema)
    const personalityProfile = {
      openness: analysis.bigFive.openness,
      conscientiousness: analysis.bigFive.conscientiousness,
      extraversion: analysis.bigFive.extraversion,
      agreeableness: analysis.bigFive.agreeableness,
      neuroticism: analysis.bigFive.neuroticism,
      workStyle: analysis.derivedTraits.workStyle,
      leadershipStyle: analysis.derivedTraits.leadershipStyle,
      communicationStyle: analysis.derivedTraits.communicationStyle,
      motivationType: analysis.derivedTraits.motivationType,
      decisionMaking: analysis.derivedTraits.decisionMaking,
      inferenceConfidence: analysis.confidence,
      analysisVersion: '2.0-gemini',
      reasoning: analysis.reasoning, // Store for debugging/transparency
      keyInsights: analysis.keyInsights
    };

    console.log('✅ Personality analysis complete:', {
      openness: personalityProfile.openness,
      conscientiousness: personalityProfile.conscientiousness,
      extraversion: personalityProfile.extraversion,
      confidence: personalityProfile.inferenceConfidence
    });

    return personalityProfile;

  } catch (error) {
    console.error('❌ Gemini personality inference failed:', error);
    console.error('Error details:', error.message);

    // Fallback to keyword-based approach (old method)
    console.log('⚠️ Falling back to keyword-based personality inference');
    const { inferPersonality } = require('./personalityInference');
    return inferPersonality(conversationMessages.map(msg => ({
      messageRole: msg.role,
      messageContent: msg.content
    })));
  }
}

module.exports = {
  inferPersonalityWithGemini,
  buildBig5Prompt
};
