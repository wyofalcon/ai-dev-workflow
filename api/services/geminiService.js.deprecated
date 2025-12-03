const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not set - Gemini features will not work');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Get Gemini 1.5 Flash model (optimized for conversations)
   * Fast, cheap (~$0.075 per 1M input tokens)
   */
  getFlashModel() {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized - missing GEMINI_API_KEY');
    }
    return this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Get Gemini 1.5 Pro model (optimized for complex tasks like resume generation)
   * More capable, higher cost (~$1.25 per 1M input tokens)
   */
  getProModel() {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized - missing GEMINI_API_KEY');
    }
    return this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * Send a conversational message (for profile building)
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages [{role: 'user'|'model', parts: [{text: '...'}]}]
   * @returns {Promise<{response: string, tokensUsed: number}>}
   */
  async sendConversationalMessage(userMessage, conversationHistory = []) {
    const model = this.getFlashModel();

    // Start chat with history
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 500, // Keep responses concise
        temperature: 0.7, // Balanced creativity
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;

    return {
      response: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  /**
   * Generate resume with personality-based framing
   * @param {Object} profileData - Complete user profile
   * @param {string} jobDescription - Target job description
   * @param {Array} selectedSections - Sections to include
   * @returns {Promise<{resumeMarkdown: string, tokensUsed: number}>}
   */
  async generateResume(profileData, jobDescription, selectedSections) {
    const model = this.getProModel();

    // Build comprehensive prompt (will enhance in Week 4)
    const prompt = this.buildResumePrompt(profileData, jobDescription, selectedSections);

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      resumeMarkdown: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  /**
   * Build resume generation prompt with personality framing
   * (Placeholder for Week 4 - will expand with personality-based logic)
   */
  buildResumePrompt(profileData, jobDescription, selectedSections) {
    return `
You are an elite-level professional resume writer and career strategist.

**USER PROFILE:**
${JSON.stringify(profileData, null, 2)}

**TARGET JOB DESCRIPTION:**
${jobDescription}

**SECTIONS TO INCLUDE:**
${selectedSections.join('\n')}

Create a professional, ATS-optimized resume in clean Markdown format.
Focus on quantifiable achievements and match job description keywords naturally.
    `.trim();
  }
}

// Singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
