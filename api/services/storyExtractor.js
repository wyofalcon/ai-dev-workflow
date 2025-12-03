/**
 * Story Extractor - Parse narratives into structured stories
 *
 * Uses Gemini to analyze user narratives and extract:
 * - Story summaries (1-2 sentences)
 * - Themes and skills demonstrated
 * - Personality signals (OCEAN trait indicators)
 * - Categorization for RAG retrieval
 */

const geminiService = require('./geminiServiceVertex');

/**
 * Build Gemini prompt for story analysis
 * @param {string} questionType - achievement, adversity, team, etc.
 * @param {string} questionText - Full question asked
 * @param {string} storyText - User's narrative response
 * @returns {string}
 */
function buildStoryAnalysisPrompt(questionType, questionText, storyText) {
  return `You are an expert career coach analyzing a professional narrative.

**QUESTION TYPE:** ${questionType}
**QUESTION ASKED:** ${questionText}
**USER'S STORY:**
${storyText}

**YOUR TASK:**
Extract structured information from this narrative for use in resume and cover letter generation.

**ANALYZE FOR:**

1. **Summary** (1-2 sentences, 3rd person)
   - Capture the essence of the story
   - Focus on outcome and impact

2. **Category** (choose ONE most relevant)
   - achievement
   - challenge_overcome
   - leadership
   - teamwork
   - innovation
   - learning
   - helping_others
   - career_change
   - problem_solving
   - adaptability

3. **Themes** (2-5 keywords)
   - Abstract concepts: ["resilience", "collaboration", "creativity"]

4. **Skills Demonstrated** (3-7 specific skills)
   - Technical: ["Python", "data analysis", "SQL"]
   - Soft: ["communication", "time management", "leadership"]
   - Domain: ["healthcare", "education", "finance"]

5. **Personality Signals** (OCEAN trait indicators, 0.0-1.0)
   - How strongly does this story signal each Big Five trait?
   - 0.0 = no evidence, 1.0 = very strong evidence

**RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks):**
{
  "summary": "User successfully led a team of 5 to complete project 2 weeks ahead of schedule despite budget constraints.",
  "category": "leadership",
  "themes": ["project-management", "resourcefulness", "team-motivation"],
  "skills_demonstrated": ["leadership", "budgeting", "agile-methodology", "stakeholder-communication"],
  "personality_signals": {
    "openness": 0.6,
    "conscientiousness": 0.9,
    "extraversion": 0.7,
    "agreeableness": 0.8,
    "neuroticism": 0.3
  },
  "relevance_tags": ["leadership", "project-management", "team-success"]
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;
}

/**
 * Extract structured information from a story
 * @param {Object} story
 * @param {string} story.question_type - achievement, adversity, etc.
 * @param {string} story.question_text - Full question
 * @param {string} story.story_text - User's narrative
 * @returns {Promise<Object>} Extracted story data
 */
async function extractStoryData(story) {
  try {
    const { question_type, question_text, story_text } = story;

    console.log(`📖 Extracting story data for: ${question_type}`);

    const prompt = buildStoryAnalysisPrompt(question_type, question_text, story_text);
    const model = geminiService.getFlashModel();
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Extract text
    let responseText;
    if (typeof response.text === 'function') {
      responseText = response.text();
    } else if (response.candidates && response.candidates[0]) {
      responseText = response.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected Gemini response format');
    }

    // Clean JSON
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const extracted = JSON.parse(cleanedResponse);

    // Validate structure
    if (!extracted.summary || !extracted.category) {
      throw new Error('Invalid extraction response structure');
    }

    console.log(`✅ Story extracted: ${extracted.category} (${extracted.skills_demonstrated.length} skills)`);

    return {
      story_summary: extracted.summary,
      category: extracted.category,
      themes: extracted.themes || [],
      skills_demonstrated: extracted.skills_demonstrated || [],
      personality_signals: extracted.personality_signals || {},
      relevance_tags: extracted.relevance_tags || [extracted.category]
    };

  } catch (error) {
    console.error('❌ Story extraction failed:', error);

    // Return basic fallback
    return {
      story_summary: story.story_text.substring(0, 200) + '...',
      category: story.question_type,
      themes: [],
      skills_demonstrated: [],
      personality_signals: {},
      relevance_tags: [story.question_type]
    };
  }
}

/**
 * Batch extract stories (process all stories for a user)
 * @param {Array} stories - [{question_type, question_text, story_text}, ...]
 * @returns {Promise<Array>} Extracted story data
 */
async function batchExtractStories(stories) {
  console.log(`🔄 Batch extracting ${stories.length} stories...`);

  const results = [];

  for (const story of stories) {
    const extracted = await extractStoryData(story);
    results.push({
      ...story,
      ...extracted
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ Batch extraction complete: ${results.length} stories processed`);

  return results;
}

module.exports = {
  extractStoryData,
  batchExtractStories
};
