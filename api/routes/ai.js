/**
 * AI Fallback Routes
 * Server-side AI generation when WebLLM is unavailable
 * Uses Gemini Flash for lightweight tasks (skill organization, chat, search)
 */

const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiServiceVertex');

/**
 * POST /api/ai/generate
 * Fallback endpoint for client-side AI tasks when WebLLM isn't ready
 * Uses Gemini 2.0 Flash (cheap, fast) for lightweight tasks
 */
router.post('/generate', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { messages, taskType } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'messages array is required'
      });
    }

    // Rate limiting hint - could be enhanced with Redis in production
    console.log(`🤖 AI Fallback request from user ${req.user.firebaseUid}, task: ${taskType || 'general'}`);

    // Build conversation for Gemini
    const systemPrompt = getSystemPromptForTask(taskType);
    const userMessage = messages[messages.length - 1]?.content || '';

    // Use Flash model for these lightweight tasks (cheaper than Pro)
    const model = geminiService.getFlashModel();

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userMessage}` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({
      response: text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      model: 'gemini-2.0-flash',
      fallback: true // Flag to indicate this was server-side
    });

  } catch (error) {
    console.error('AI Fallback error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/organize-skills
 * Specialized endpoint for skill organization
 */
router.post('/organize-skills', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'skills array is required'
      });
    }

    console.log(`🎯 Organizing ${skills.length} skills for user ${req.user.firebaseUid}`);

    const model = geminiService.getFlashModel();

    const prompt = `You are an expert resume optimizer. 
Analyze the following list of skills and group them into logical professional categories.
Also, identify the 5 most high-impact/marketable skills from this list.

Return ONLY a valid JSON object with this structure:
{
  "categories": {
    "Programming Languages": ["Python", "JavaScript"],
    "Frameworks": ["React", "Node.js"],
    "Tools": ["Git", "Docker"],
    "Soft Skills": ["Leadership", "Communication"]
  },
  "topSkills": ["Python", "React", "Leadership", "Docker", "JavaScript"]
}

Skills List: ${skills.join(', ')}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.3, // Lower temp for structured output
      }
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({
        ...parsed,
        fallback: true
      });
    } else {
      throw new Error('Failed to parse AI response');
    }

  } catch (error) {
    console.error('Skill organization error:', error);
    next(error);
  }
});

/**
 * POST /api/ai/extension/tailor
 * Endpoint for Chrome Extension Quick Tailor feature
 * Replaces the local WebLLM inference
 */
router.post('/extension/tailor', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.length < 50) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Job description is too short'
      });
    }

    console.log(`🧩 Extension Tailor request for user ${req.user.firebaseUid}`);

    const model = geminiService.getFlashModel();

    const prompt = `You are an expert resume tailorer. Your goal is to analyze a job description and suggest key skills and keywords to include in a resume.

Analyze the following job description and list the top 5 most important technical skills and 3 key soft skills required. Also suggest a 1-sentence professional summary tailored to this role.

JOB DESCRIPTION:
${jobDescription}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({
      result: text,
      model: 'gemini-2.0-flash'
    });

  } catch (error) {
    console.error('Extension Tailor error:', error);
    next(error);
  }
});

/**
 * Get appropriate system prompt based on task type
 */
function getSystemPromptForTask(taskType) {
  const prompts = {
    'skill-organization': `You are an expert resume optimizer. Categorize skills professionally.`,
    'search-suggestions': `You are a helpful assistant suggesting relevant skills and profile sections. Be concise.`,
    'onboarding-chat': `You are a friendly resume building assistant. Ask one question at a time to gather resume info.`,
    'profile-enhancement': `You are a career coach helping improve resume bullet points. Use action verbs and metrics.`,
    default: `You are a helpful AI assistant for resume building. Be concise and professional.`
  };

  return prompts[taskType] || prompts.default;
}

module.exports = router;
