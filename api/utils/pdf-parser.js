const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    console.error("PDF path:", filePath);
    console.error("Error details:", error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

module.exports = { extractTextFromPdf };
