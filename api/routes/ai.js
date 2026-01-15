/**
 * AI Fallback Routes
 * Server-side AI generation when WebLLM is unavailable
 * Uses Gemini Flash for lightweight tasks (skill organization, chat, search)
 */

// [FEAT-LOCALAI-001] AI Fallback Route
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
    
    // Convert frontend messages (OpenAI format) to Gemini format
    // Frontend: [{ role: 'user'|'assistant'|'system', content: '...' }]
    // Gemini: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    
    let history = [];
    let lastUserMessage = '';
    
    // Process messages to separate history and the final new message
    // Also handle system prompt by prepending to first user message if possible, 
    // or just treating it as context.
    
    const relevantMessages = messages.filter(m => m.role !== 'system');
    
    if (relevantMessages.length > 0) {
        lastUserMessage = relevantMessages[relevantMessages.length - 1].content;
        
        // History is everything BEFORE the last message
        const historyMessages = relevantMessages.slice(0, -1);
        
        history = historyMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
    }
    
    // Inject system prompt into history or the message
    // Strategy: If history exists, prepend system prompt to the very first message's text.
    // If no history, prepend to the current user message.
    
    if (history.length > 0) {
        if (history[0].role === 'user') {
            history[0].parts[0].text = `${systemPrompt}\n\n${history[0].parts[0].text}`;
        }
    } else {
        lastUserMessage = `${systemPrompt}\n\n${lastUserMessage}`;
    }

    // Use sendConversationalMessage which handles history
    const result = await geminiService.sendConversationalMessage(lastUserMessage, history);

    res.json({
      response: result.response,
      tokensUsed: result.tokensUsed,
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
