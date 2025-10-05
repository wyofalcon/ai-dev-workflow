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
    const form = formidable({ keepExtensions: true });
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

      **CONTENT STRATEGY:**
      - **Go Beyond Keywords:** Don't just match skills to the job description. Act as a career strategist.
      - **Infer Positive Traits:** From the user's work history and stories, infer desirable traits like 'versatility' (from varied roles), 'curiosity' (from learning new skills), 'coachability', and 'problem-solving'.
      - **Showcase, Don't Exaggerate:** Weave these inferred traits into the professional summary and accomplishment bullet points. Your goal is to frame the user's existing experience in the most compelling light possible, without inventing skills.

      **FORMATTING & EXECUTION RULES:**
      1.  **Header Formatting:** The resume MUST start with the candidate's name as a level 1 Markdown heading (#), followed by their contact information on the next line.
      2.  **Generate All Requested Sections:** You MUST generate a section for EACH item listed in the user's `<SECTIONS_TO_INCLUDE>` input.
      3.  **Section Formatting:** For EACH section you generate, you MUST format it as follows:
          - The section title MUST be a level 2 Markdown heading (e.g., `## PROFESSIONAL SUMMARY`).
          - The title MUST be immediately followed by a Markdown horizontal rule on the next line (`---`).
      4.  **Content Strategy:** Build a complete, professional resume based on all the information the user has provided. Within that resume, strategically highlight and prioritize the skills, experiences, and inferred traits that are most relevant to the `JOB_DESCRIPTION`.
      5.  **Bolding:** Use double asterisks (**) for bolding job titles and degrees.
      6.  **No Invention:** Do not exaggerate or invent qualifications.
      7.  **No Commentary:** Your output must begin with the candidate's name and contain only the resume content.

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