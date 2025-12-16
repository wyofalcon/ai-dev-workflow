/**
 * Gemini Service using Google AI Studio API Key
 * Alternative to Vertex AI - uses API key authentication
 * Requires @google/generative-ai package
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiServiceApiKey {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
      this.genAI = null;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        console.log("✅ Gemini API initialized with API Key");
      } catch (error) {
        console.warn("⚠️ Gemini API initialization failed:", error.message);
        this.genAI = null;
      }
    }
  }

  /**
   * Get Gemini 2.0 Flash model
   */
  getFlashModel() {
    if (!this.genAI) {
      throw new Error("Gemini API not initialized (missing API key?)");
    }
    return this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  /**
   * Get Gemini 1.5 Pro model (2.5 not yet available in AI Studio as of late 2024/early 2025? using 1.5 Pro or latest available)
   * Using 'gemini-1.5-pro' as safe default, user can update string.
   */
  getProModel() {
    if (!this.genAI) {
      throw new Error("Gemini API not initialized (missing API key?)");
    }
    // Note: Vertex uses 'gemini-2.5-pro', AI Studio might vary. Using 1.5-pro-latest or similar is safest.
    // We'll stick to 'gemini-1.5-pro' for compatibility or 'gemini-pro'
    return this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  /**
   * Send conversational message
   */
  async sendConversationalMessage(userMessage, conversationHistory = []) {
    const model = this.getFlashModel();

    // Map conversation history to Gemini format if needed
    // Vertex and AI Studio formats are slightly different
    const history = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    return {
      response: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  /**
   * Generate resume
   */
  async generateResume(profileData, jobDescription, selectedSections) {
    const model = this.getProModel();
    // Re-use the prompt builder from Vertex service or duplicate logic
    // For now, we assume the caller handles the prompt construction or we duplicate it
    // But this class usually takes a prompt directly in 'generateContent'
    // This method signature in Vertex service was: generateResume(profileData, jobDescription, selectedSections)
    // which BUILDS the prompt.
    // We should copy the buildResumePrompt logic or refactor it into a shared utility.
    // For this specific file, I'll implement a basic version or throw saying "Use generateContent directly"
    throw new Error(
      "generateResume helper not implemented in ApiKey service. Use generateContent directly."
    );
  }
}

module.exports = new GeminiServiceApiKey();
