
const pdfParse = require('pdf-parse');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('pdfParse value:', pdfParse);

if (typeof pdfParse !== 'function') {
    if (pdfParse.default && typeof pdfParse.default === 'function') {
        console.log('Found default export function');
    }
}
