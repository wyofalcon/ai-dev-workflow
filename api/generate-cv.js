import { GoogleGenerativeAI } from '@google/generative-ai';

import formidable from 'formidable';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfjsDist from 'pdfjs-dist/build/pdf.js';
const { getDocument } = pdfjsDist;

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseFormData = async (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true }); // This will now work correctly with the 'import' syntax
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        const singleFields = {};
        for (const key in fields) {
          singleFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
        }
        const singleFiles = {};
        for (const key in files) {
            singleFiles[key] = Array.isArray(files[key]) ? files[key] : [files[key]];
        }
        resolve({ fields: singleFields, files: singleFiles });
      }
    });
  });
};

const extractTextFromFile = async (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return '';
        }
        const dataBuffer = fs.readFileSync(filePath);

        if (extension === 'docx') {
            const { value } = await mammoth.extractRawText({ buffer: dataBuffer });
            return value;
        } else if (extension === 'pdf') {
            const uint8Array = new Uint8Array(dataBuffer);
            const loadingTask = getDocument(uint8Array);
            const pdf = await loadingTask.promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                text += strings.join(' ') + '\n';
            }
            return text;
        } else {
            // Fallback for other text-based files like .txt
            return dataBuffer.toString('utf8');
        }
    } catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error);
        return '';
    }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fields, files } = await parseFormData(req);
    const { resumeText, personalStories, jobDescription, selectedSections: sectionsString } = fields;
    const documents = files.documents || [];
    
    const selectedSections = sectionsString ? sectionsString.split(',') : [];

    if ((documents.length === 0 && !resumeText) || !jobDescription || selectedSections.length === 0) {
      return res.status(400).json({ error: 'Resume, job description, and at least one section are required.' });
    }

    let originalCvText = '';
    if (resumeText) {
      originalCvText = resumeText;
    } else {
      for (const file of documents) {
        const text = await extractTextFromFile(file.filepath);
        originalCvText += text + '\n\n---\n\n';
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      }
    }
    
    console.log('Extracted CV text:', originalCvText);



    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });

    const prompt = `
      You are an elite-level professional resume writer. Your task is to create a clean, professional, single-column resume in Markdown format based on the user's provided information and a target job description.

      **PRIMARY DIRECTIVE:**
      Analyze all inputs to cherry-pick the most relevant and impactful skills, work history, and project details that directly align with the job description. Your goal is to frame the user's existing skills and experience in the most effective light possible.

      **MARKDOWN FORMATTING RULES:**
      - **Headers:** Use a level 1 heading (#) for the candidate's name. Use level 2 headings (##) for section titles.
      - **Horizontal Rules:** After each section heading (like ## PROFESSIONAL SUMMARY), you MUST insert a horizontal rule (---).
      - **Lists:** Use standard Markdown bullet points (*) for lists under Skills and Work History.
      - **Bolding:** Use double asterisks (**) for bolding job titles and degrees, like **Sales Manager**.

      **RESUME STRUCTURE (MUST be followed precisely):**

      # <p align="center">JESSICA CLAIRE</p>
      <p align="center">San Francisco, CA 94105</p>
      <p align="center">(555) 432-1000 - resumesample@example.com</p>

      ## PROFESSIONAL SUMMARY
      ---
      (A 2-3 sentence summary tailored to the job description, highlighting key qualifications.)

      ## SKILLS
      ---
      *   Skill 1, Skill 2, Skill 3
      *   Skill 4, Skill 5, Skill 6

      ## WORK HISTORY
      ---
      **Sales Manager**
      Bed Bath & Beyond, Inc. - San Francisco | 03/2021 to Current
      *   Accomplishment-driven bullet point 1 (Quantify results where possible).
      *   Accomplishment-driven bullet point 2.

      **Sales Associate**
      Target - San Francisco | 06/2020 to 03/2021
      *   Accomplishment-driven bullet point 1.
      *   Accomplishment-driven bullet point 2.

      ## EDUCATION
      ---
      2013
      **Bachelor of Arts: Business**
      San Francisco State University - San Francisco, CA

      **CRITICAL EXECUTION RULES:**
      1.  **Strict Adherence:** Follow the 'RESUME_STRUCTURE' and 'MARKDOWN FORMATTING RULES' exactly as defined.
      2.  **Relevance is Key:** Only include information that is directly relevant to the 'JOB_DESCRIPTION'.
      3.  **No Invention:** Do not exaggerate or invent qualifications.
      4.  **Section Control:** Only generate the sections listed in '<SECTIONS_TO_INCLUDE>'.
      5.  **No Commentary:** Your output must begin with the candidate's name and contain only the resume content.

      ---
      **BEGIN INPUTS**
      ---
      <ORIGINAL_RESUME_TEXT>
      ${originalCvText}
      </ORIGINAL_RESUME_TEXT>
      <PERSONAL_STORIES>
      ${personalStories}
      </PERSONAL_STORIES>
      <JOB_DESCRIPTION>
      ${jobDescription}
      </JOB_DESCRIPTION>
      <SECTIONS_TO_INCLUDE>
      ${selectedSections.join('\n')}
      </SECTIONS_TO_INCLUDE>
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();
    
    res.status(200).json({ generatedCv: generatedText });

  } catch (error) {
    console.error('Error in /api/generate-cv:', error);
    res.status(500).json({ error: 'An internal server error occurred while generating the CV.' });
  }
}
