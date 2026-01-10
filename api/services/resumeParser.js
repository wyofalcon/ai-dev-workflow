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

  // Use Pro model for "Smart" parsing (better extraction and reasoning)
  const model = geminiService.getProModel();

  const prompt = `You are a world-class AI Resume Strategist and Data Extraction Specialist. 
Your goal is to perform a DEEP analysis of the provided resume text and extract high-fidelity structured data.

**RESUME TEXT:**
${resumeText}

---

**CORE TASKS:**
1. **ENTITY EXTRACTION**: Identify all standard fields (name, contact, work, education).
2. **SKILL INFERENCE**: Look beyond the "Skills" section. Identify "hidden skills" demonstrated in work descriptions (e.g., if they mention "A/B testing", infer "Data-Driven Decision Making" and "Product Analytics").
3. **ACHIEVEMENT ANALYSIS**: For every work experience, identify the key quantifiable impact. If no numbers are present, summarize the core value delivered.
4. **STANDARDIZATION**: Normalize job titles and education levels to standard industry terms.
5. **CAREER LEVEL**: Based on the progression and years of experience, determine if the candidate is entry, mid, senior, or executive.

**REQUIRED JSON STRUCTURE:**
{
  "fullName": "string or null",
  "email": "string or null", 
  "phone": "string or null",
  "location": "string (City, State format) or null",
  "linkedinUrl": "string or null",
  "summary": "A 2-3 sentence professional summary optimized for modern ATS",
  "yearsExperience": total number of years across all roles,
  "careerLevel": "entry|mid|senior|executive",
  "currentTitle": "Standardized job title",
  "skills": ["Broad array of skills, including inferred ones"],
  "industries": ["Target industries based on experience"],
  "education": [
    {
      "degree": "Standardized degree name",
      "school": "Institution name",
      "year": "Graduation year",
      "field": "Major/Field of study"
    }
  ],
  "certifications": ["array of certifications"],
  "languages": ["array of languages"],
  "experience": [
    {
      "title": "Standardized title",
      "company": "Company name",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or 'Present'",
      "highlights": ["Power bullets: Action Verb + Task + Quantifiable Result"],
      "inferredSkills": ["Skills demonstrated specifically in this role"]
    }
  ]
}

**INSTRUCTIONS:**
- Return ONLY valid JSON. No markdown code blocks.
- Ensure all dates are consistent.
- Be aggressive in finding skills.
- If a section is missing, return an empty array [].

Return ONLY the JSON object:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
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
