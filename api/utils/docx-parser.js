const mammoth = require('mammoth');

async function extractTextFromDocx(fileInput) {
    try {
        let result;
        if (Buffer.isBuffer(fileInput)) {
            result = await mammoth.extractRawText({ buffer: fileInput });
        } else {
            result = await mammoth.extractRawText({ path: fileInput });
        }
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw new Error('Failed to extract text from DOCX.');
    }
}

module.exports = { extractTextFromDocx };
