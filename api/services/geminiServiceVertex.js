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
   * Get Gemini 2.0 Flash model (optimized for conversations, latest stable)
   */
  getFlashModel() {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }
    return this.vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
    });
  }

  /**
   * Get Gemini 2.5 Pro model (optimized for complex tasks, latest stable)
   */
  getProModel() {
    if (!this.vertexAI) {
      throw new Error('Vertex AI not initialized');
    }
    return this.vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
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

  buildResumePrompt({ resumeText, personalStories, jobDescription, selectedSections, personality }) {
    // Build personality-based framing guidance
    let personalityGuidance = '';

    if (personality) {
      const traits = [];

      // Openness: Innovation vs Reliability
      if (personality.openness > 70) {
        traits.push('- **INNOVATION FOCUS**: Use creative, forward-thinking language. Highlight: "pioneered," "innovated," "transformed," "reimagined." Emphasize adaptability and new approaches.');
      } else if (personality.openness < 40) {
        traits.push('- **RELIABILITY FOCUS**: Use proven, traditional terminology. Highlight: "maintained," "ensured," "consistently," "established." Emphasize stability and proven methods.');
      } else {
        traits.push('- **BALANCED APPROACH**: Mix innovative and reliable language. Show both creativity and dependability.');
      }

      // Conscientiousness: Detail vs Big Picture
      if (personality.conscientiousness > 70) {
        traits.push('- **DETAIL-ORIENTED**: Include specific metrics, processes, and methodologies. Use: "meticulously," "systematically," "precisely." Show attention to accuracy and planning.');
      } else if (personality.conscientiousness < 40) {
        traits.push('- **BIG PICTURE**: Focus on outcomes and vision. Use: "led," "drove," "initiated." Emphasize flexibility and adaptability over process.');
      } else {
        traits.push('- **BALANCED EXECUTION**: Show both strategic thinking and execution quality.');
      }

      // Extraversion: Team vs Individual
      if (personality.extraversion > 70) {
        traits.push('- **TEAM-FOCUSED**: Emphasize collaboration, leadership, and interpersonal impact. Use: "led team of," "collaborated with," "mentored," "facilitated." Show people skills.');
      } else if (personality.extraversion < 40) {
        traits.push('- **INDEPENDENT CONTRIBUTOR**: Highlight individual technical expertise and self-directed work. Use: "developed," "analyzed," "researched," "designed." Show deep expertise.');
      } else {
        traits.push('- **BALANCED COLLABORATION**: Show both teamwork and independent achievement.');
      }

      // Agreeableness: Collaborative vs Results-Driven
      if (personality.agreeableness > 70) {
        traits.push('- **COLLABORATIVE STYLE**: Emphasize teamwork, consensus-building, and supportive leadership. Use: "partnered with," "supported," "facilitated," "aligned."');
      } else if (personality.agreeableness < 40) {
        traits.push('- **RESULTS-DRIVEN**: Focus on competitive achievements and decisive action. Use: "drove," "achieved," "exceeded," "outperformed." Show winning results.');
      } else {
        traits.push('- **BALANCED LEADERSHIP**: Show both results achievement and team support.');
      }

      // Neuroticism: Conservative vs Bold Claims
      if (personality.neuroticism > 60) {
        traits.push('- **CONSERVATIVE FRAMING**: Use measured, factual language. Avoid superlatives. Present achievements as solid contributions rather than bold claims.');
      } else if (personality.neuroticism < 30) {
        traits.push('- **CONFIDENT FRAMING**: Use bold, impactful language. Use: "dramatically," "significantly," "revolutionized." Show major impact.');
      } else {
        traits.push('- **BALANCED CONFIDENCE**: Professional confidence without overselling.');
      }

      personalityGuidance = `
📊 **PERSONALITY-BASED WRITING STYLE:**

This candidate's personality profile indicates the following preferences:

**Big Five Scores:**
- Openness: ${personality.openness}/100 ${personality.openness > 70 ? '(High - Innovative)' : personality.openness < 40 ? '(Low - Traditional)' : '(Moderate)'}
- Conscientiousness: ${personality.conscientiousness}/100 ${personality.conscientiousness > 70 ? '(High - Detail-oriented)' : personality.conscientiousness < 40 ? '(Low - Flexible)' : '(Moderate)'}
- Extraversion: ${personality.extraversion}/100 ${personality.extraversion > 70 ? '(High - Team-focused)' : personality.extraversion < 40 ? '(Low - Independent)' : '(Moderate)'}
- Agreeableness: ${personality.agreeableness}/100 ${personality.agreeableness > 70 ? '(High - Collaborative)' : personality.agreeableness < 40 ? '(Low - Competitive)' : '(Moderate)'}
- Neuroticism: ${personality.neuroticism}/100 ${personality.neuroticism > 60 ? '(Higher - Conservative)' : personality.neuroticism < 30 ? '(Lower - Bold)' : '(Moderate)'}

**Work Style:** ${personality.workStyle || 'balanced'}
**Communication:** ${personality.communicationStyle || 'professional'}

**WRITING GUIDELINES - Follow these personality-aligned principles:**
${traits.join('\n')}

⚠️ CRITICAL: The resume MUST authentically reflect this personality. Don't just list traits - frame ALL achievements through this lens.
`;
    }

    // Determine if we have substantial content
    const hasContent = (resumeText && resumeText.length > 20) || (personalStories && personalStories.length > 50);

    return `You are an elite-level professional resume writer and career strategist with 15+ years of experience crafting resumes that get interviews.

${personalityGuidance}

**TARGET JOB DESCRIPTION:**
${jobDescription}

**CANDIDATE'S EXPERIENCE:**
${resumeText || 'No formal resume provided - extract experience from personal stories below'}

**CANDIDATE'S STORIES & ACHIEVEMENTS:**
${personalStories || 'Limited information - create professional framework with guidance for candidate'}

**REQUIRED SECTIONS:**
${Array.isArray(selectedSections) ? selectedSections.join(', ') : selectedSections}

---

## INSTRUCTIONS:

${hasContent
  ? `1. **EXTRACT & ENHANCE**: Pull concrete experience, skills, and achievements from candidate's stories
2. **PERSONALITY FRAMING**: Frame EVERY achievement through the personality lens above
3. **ATS OPTIMIZATION**: Include exact keywords from job description naturally`
  : `1. **CREATE FRAMEWORK**: Create professional resume template with [EDIT: ...] placeholders
2. **PERSONALITY FRAMING**: Even placeholders should reflect personality style
3. **ATS OPTIMIZATION**: Pre-fill with keywords from job description`
}
4. **ACTION VERBS**: Use strong, personality-aligned action verbs
5. **QUANTIFY EVERYTHING**: Every bullet needs numbers/percentages/scale
6. **CONCISE BULLETS**: 1-2 lines maximum per bullet
7. **MARKDOWN FORMAT**: Use clean Markdown with ### headers
8. **COMPELLING SUMMARY**: 2-3 sentence Professional Summary for THIS role
9. **EXACT JOB TITLE**: Use exact title from job description
10. **CONTACT INFO**: Include: [Your Name], [City, State], [Phone], [Email], [LinkedIn]

---

## OUTPUT FORMAT:

# [Candidate Name]
[City, State] | [Phone] | [Email] | [LinkedIn URL]

---

## Professional Summary

[2-3 powerful sentences positioning candidate as perfect fit. Reflect personality style.]

---

## Core Competencies

[8-12 relevant skills from job description and candidate background]

---

## Professional Experience

**[Job Title]** | [Company] | [Location] | [Dates]
- [Achievement with quantifiable result - personality-framed]
- [Achievement with quantifiable result - personality-framed]
- [Achievement with quantifiable result - personality-framed]

[2-3 most relevant positions]

---

## Education

**[Degree]** | [School] | [Year]

---

Generate complete, ATS-optimized resume now:`.trim();
  }
}

// Export singleton
const geminiServiceVertex = new GeminiServiceVertex();
module.exports = geminiServiceVertex;
