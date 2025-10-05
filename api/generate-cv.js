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
      You are an elite-level professional resume writer and career strategist. Your task is to create a clean, professional, and easy-to-read resume in Markdown format.

      **PRIMARY DIRECTIVE:**
      Analyze the user's inputs and the job description to craft a resume that makes the user the most compelling candidate possible. Cherry-pick only the most relevant skills and experiences.

      **RESUME_STRUCTURE:**
      Your output MUST follow this structure precisely. Do not add, remove, or rename sections.

      # Candidate Name
      <Contact Info: Phone | Email | Location | LinkedIn (if available)>

      ## Professional Summary
      (A 2-3 sentence summary tailored to the job description, highlighting key qualifications.)

      ## Skills
      *   **Category 1:** Skill A, Skill B, Skill C
      *   **Category 2:** Skill D, Skill E, Skill F

      ## Professional Experience
      **Job Title** | **Company** | **Location** | *(Month YYYY – Month YYYY or Present)*
      *   Accomplishment-driven bullet point 1 (Quantify results where possible).
      *   Accomplishment-driven bullet point 2.

      **Another Job Title** | **Company** | **Location** | *(Month YYYY – Month YYYY)*
      *   Accomplishment-driven bullet point 1.
      *   Accomplishment-driven bullet point 2.

      ## Education
      **Degree or Program** | **Institution** | **Location** | *(Month YYYY – Month YYYY or In Progress)*
      *   (Optional: Relevant coursework or honors).

      ## Certifications
      **Certification Name** | **Issuing Organization** | *(Year)*

      **CRITICAL RULES:**
      1.  **Strict Adherence:** Follow the \`RESUME_STRUCTURE\` exactly as defined.
      2.  **Relevance is Key:** Only include information that is directly relevant to the \`JOB_DESCRIPTION\`.
      3.  **Concise & Impactful:** Use strong action verbs and quantify achievements. No filler.
      4.  **No Invention:** Do not exaggerate or invent qualifications.
      5.  **Section Control:** Only generate the sections listed in \`<SECTIONS_TO_INCLUDE>\`.
      6.  **No Commentary:** Your output must begin with the candidate's name and contain only the resume content.
      7.  **Source from Inputs:** Base the content entirely on the provided \`<ORIGINAL_RESUME_TEXT>\` and \`<PERSONAL_STORIES>\`.

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
