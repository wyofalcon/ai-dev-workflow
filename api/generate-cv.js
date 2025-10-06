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
      You are an elite-level professional resume writer and career strategist.
      Your task is to synthesize the user's resume, personal stories, and a target job description into a single, compelling resume in clean, standard Markdown format.

      **HEADER FORMATTING (MUST FOLLOW):**
      - The candidate's name MUST be the very first thing in the resume.
      - The name MUST be a level 1 Markdown heading (e.g., # John Doe).
      - The contact information (phone, email, location) MUST appear directly below the name in a clean, professional format.

      **PRIMARY GOAL:**
      Make the user the most compelling candidate possible. Your main goal is not just to list skills, but to tell a story that showcases the user's value.

      **CONTENT GUIDELINES:**
      - **Use the Personal Stories:** This is the most important input. Use the stories to uncover and showcase unique skills and positive traits like 'versatility', 'curiosity', and 'problem-solving'.
      - **Build a Comprehensive Resume:** Create a full resume based on all the user's information. Within that resume, strategically highlight the skills and experiences that align with the target job description.
      - **Generate All Requested Sections:** You MUST create a section in the resume for every item listed in the user's '<SECTIONS_TO_INCLUDE>' input.

      **OUTPUT RULES:**
      - Your output MUST be only the resume content in Markdown format. 
      - Begin directly with the candidate's name. Do not include any commentary, introductions, or explanations.

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