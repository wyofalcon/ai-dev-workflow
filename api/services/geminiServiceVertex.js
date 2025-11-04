/**
 * Gemini Service using Vertex AI (GCP Native)
 * Alternative to API key approach - uses service account authentication
 */

const { VertexAI } = require('@google-cloud/vertexai');

class GeminiServiceVertex {
  constructor() {
    // Get project ID from environment or Secret Manager
    this.projectId = process.env.GCP_PROJECT_ID || 'cvstomize';
    this.location = 'us-central1';

    try {
      this.vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
      });
      console.log('✅ Vertex AI initialized for project:', this.projectId);
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed:', error.message);
      this.vertexAI = null;
    }
  }

  /**
   * Get Gemini 1.5 Flash model (optimized for conversations)
   */
  getFlashModel() {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }
    return this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  /**
   * Get Gemini 1.5 Pro model (optimized for complex tasks)
   */
  getProModel() {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }
    return this.vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });
  }

  /**
   * Send conversational message
   */
  async sendConversationalMessage(userMessage, conversationHistory = []) {
    const model = this.getFlashModel();

    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    return {
      response: response.candidates[0].content.parts[0].text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  /**
   * Generate resume
   */
  async generateResume(profileData, jobDescription, selectedSections) {
    const model = this.getProModel();
    const prompt = this.buildResumePrompt(profileData, jobDescription, selectedSections);

    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      resumeMarkdown: response.candidates[0].content.parts[0].text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

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

// Export singleton
const geminiServiceVertex = new GeminiServiceVertex();
module.exports = geminiServiceVertex;
