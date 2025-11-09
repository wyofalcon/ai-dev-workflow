const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractTextFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        console.error('PDF path:', filePath);
        console.error('Error details:', error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

module.exports = { extractTextFromPdf };
