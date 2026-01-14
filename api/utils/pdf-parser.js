const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractTextFromPdf(fileInput) {
  try {
    let dataBuffer;
    if (Buffer.isBuffer(fileInput)) {
      dataBuffer = fileInput;
    } else {
      dataBuffer = fs.readFileSync(fileInput);
    }
    const result = await pdfParse(dataBuffer);
    return result.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    if (!Buffer.isBuffer(fileInput)) {
      console.error("PDF path:", fileInput);
    }
    console.error("Error details:", error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

module.exports = { extractTextFromPdf };
