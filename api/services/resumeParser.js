/**
 * Resume Parser Service
 * Extracts structured profile data from uploaded resumes using Gemini AI
 */

const geminiService = require('./geminiServiceVertex');

/**
 * Parse resume text and extract structured profile data
 * @param {string} resumeText - Raw text content from uploaded resume
 * @returns {Promise<Object>} Extracted profile data
 */
async function parseResume(resumeText) {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short to parse');
  }

  const model = geminiService.getFlashModel();

  const prompt = `You are an expert resume parser. Extract structured profile information from the following resume text.

**RESUME TEXT:**
${resumeText}

---

**INSTRUCTIONS:**
Extract the following information from the resume. Return ONLY valid JSON, no markdown code blocks.
For any field you cannot find or confidently extract, use null.
For arrays, return empty array [] if no items found.

**REQUIRED JSON STRUCTURE:**
{
  "fullName": "string or null",
  "email": "string or null", 
  "phone": "string or null",
  "location": "string (City, State format) or null",
  "linkedinUrl": "string or null",
  "summary": "string (professional summary if present) or null",
  "yearsExperience": number or null,
  "careerLevel": "entry|mid|senior|executive or null",
  "currentTitle": "string (most recent job title) or null",
  "skills": ["array", "of", "skills"],
  "industries": ["array", "of", "industries"],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "year": "string or null",
      "field": "string or null"
    }
  ],
  "certifications": ["array", "of", "certifications"],
  "languages": ["array", "of", "languages"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string or null",
      "startDate": "string or null",
      "endDate": "string or null (or 'Present')",
      "highlights": ["array", "of", "bullet", "points"]
    }
  ]
}

Return ONLY the JSON object, nothing else:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.1, // Low temperature for consistent parsing
      },
    });

    const response = result.response;
    let responseText = response.candidates[0].content.parts[0].text;

    // Clean up response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Parse JSON
    const parsedData = JSON.parse(responseText);

    // Validate required structure
    const validatedData = {
      fullName: parsedData.fullName || null,
      email: parsedData.email || null,
      phone: parsedData.phone || null,
      location: parsedData.location || null,
      linkedinUrl: parsedData.linkedinUrl || null,
      summary: parsedData.summary || null,
      yearsExperience: typeof parsedData.yearsExperience === 'number' ? parsedData.yearsExperience : null,
      careerLevel: ['entry', 'mid', 'senior', 'executive'].includes(parsedData.careerLevel) 
        ? parsedData.careerLevel 
        : null,
      currentTitle: parsedData.currentTitle || null,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      industries: Array.isArray(parsedData.industries) ? parsedData.industries : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications : [],
      languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
      experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
    };

    return {
      success: true,
      data: validatedData,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response as JSON');
    }
    
    throw error;
  }
}

/**
 * Extract text from uploaded file based on file type
 * Currently supports plain text. PDF parsing can be added with pdf-parse library.
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(fileBuffer, mimeType) {
  // Plain text files
  if (mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8');
  }

  // PDF files - use pdf-parse if available
  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      // pdf-parse not installed or parsing failed
      console.error('PDF parsing failed:', error.message);
      throw new Error('PDF parsing is not available. Please upload a text file or paste your resume content.');
    }
  }

  // Word documents - could add mammoth for .docx support
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing failed:', error.message);
      throw new Error('Word document parsing is not available. Please upload a PDF or text file.');
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, DOCX, or TXT file.`);
}

module.exports = {
  parseResume,
  extractTextFromFile,
};
