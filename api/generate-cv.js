import { GoogleGenerativeAI } from '@google/generative-ai';

import formidable from 'formidable';
import fs from 'fs';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist/build/pdf.js';

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
      You are an elite-level professional resume writer and career strategist. Your task is to act as a personal hiring consultant for the user.
      **PRIMARY DIRECTIVE:**
      Analyze the provided job posting. If necessary, use your external knowledge to understand the nuances of the role and the company's industry to determine what a top-tier candidate profile looks like. Your goal is to craft a clean, professional, and easy-to-read resume that makes the user the most compelling candidate possible.
      **INPUTS:**
      1.  \`<ORIGINAL_RESUME_TEXT>\`: Raw text from the user's documents.
      2.  \`<PERSONAL_STORIES>\`: Additional context, projects, or skills provided by the user. This is often where the most valuable, unique qualifications are hidden.
      3.  \`<JOB_DESCRIPTION>\`: The target job.
      4.  \`<SECTIONS_TO_INCLUDE>\`: The specific resume sections the user has requested.
      **CRITICAL RULES OF EXECUTION:**
      1.  **Cherry-Pick Excellence:** Scrutinize all inputs. Your job is to "cherry-pick" only the most relevant and impactful skills, work history, and project details that directly align with the job description.
      2.  **No Filler, No Repetition:** The final resume must be concise. Do not repeat information. Do not add "filler" language. Every word should serve a purpose.
      3.  **No Exaggeration:** You must not exaggerate or invent qualifications. Your role is to frame the user's existing skills and experience in the most professional and effective light possible.
      4.  **Strict Formatting:** The output MUST be clean, structured Markdown. This is not optional. Use '#' for the candidate's name (which should serve as the resume title in large, bold letters), '##' for section headers (e.g., "## Professional Experience"), and '*' for bullet points. IMMEDIATELY after the name, include the contact information (email, phone, address, LinkedIn, etc.) as a simple paragraph or unordered list - keep this contact info smaller and well-organized. Do not add any other formatting. Ensure the resume is formatted in a way that it will be easy to read and print. It should look professional on a standard US Letter page.
      5.  **Header Structure:** Start with the candidate's full name as a # header, followed immediately by their contact information in a clean, organized format (email, phone, location, LinkedIn profile if available). Then proceed with the requested sections.
      5.  **Header Structure:** Start with the candidate's full name as a # header, followed immediately by their contact information in a clean, organized format (email, phone, location, LinkedIn profile if available). Then proceed with the requested sections.
      6.  **Strict Section Adherence:** You MUST only generate the sections listed in \`<SECTIONS_TO_INCLUDE>\`. Do not add, remove, or rename sections.
      7.  **No Commentary:** Do not include any explanations, introductions, or concluding remarks in your output. The response must begin directly with the candidate's name.
      8.  **Reference uploaded documents:** Your "Cherry-picked excellence" must be based on the provided documents. Do not reference any external sources or knowledge.
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
