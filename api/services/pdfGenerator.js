/**
 * PDF Generation Service using Puppeteer
 *
 * Converts Markdown resumes to professional PDF format with:
 * - Multiple professional templates (Classic, Modern, Minimal)
 * - ATS-friendly formatting
 * - Consistent styling and spacing
 * - Optimized for both digital and print
 *
 * Uses Puppeteer for headless Chrome PDF generation
 */

const puppeteer = require('puppeteer');
const { marked } = require('marked');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.browser = null;

    // Configure marked for clean HTML output
    marked.setOptions({
      breaks: true,
      gfm: true, // GitHub Flavored Markdown
      headerIds: false, // Don't add IDs to headers
      mangle: false // Don't mangle email addresses
    });
  }

  /**
   * Initialize browser instance (reuse across requests for performance)
   * CRITICAL FIX: Use system Chromium from Docker (Bug #2 fix)
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Overcome limited resource problems
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions'
        ]
      });
      console.log('✅ Puppeteer browser initialized with system Chromium');
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Browser closed');
    }
  }

  /**
   * Generate PDF from markdown resume
   * @param {string} markdown - Resume markdown content
   * @param {string} template - Template name: 'classic', 'modern', 'minimal'
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(markdown, template = 'classic') {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Convert markdown to HTML
      const htmlContent = marked.parse(markdown);

      // Get template CSS
      const css = this._getTemplateCSS(template);

      // Build complete HTML document
      const fullHTML = this._buildHTML(htmlContent, css, template);

      // Set page content
      await page.setContent(fullHTML, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: 'Letter', // 8.5 x 11 inches
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.75in',
          bottom: '0.5in',
          left: '0.75in'
        },
        preferCSSPageSize: false
      });

      return pdfBuffer;

    } finally {
      await page.close();
    }
  }

  /**
   * Build complete HTML document with CSS
   */
  _buildHTML(contentHTML, css, template) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    ${css}
  </style>
</head>
<body class="resume-${template}">
  <div class="resume-container">
    ${contentHTML}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get CSS for specific template
   */
  _getTemplateCSS(template) {
    const baseCSS = `
      /* Base Reset & Print Optimization */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Calibri', 'Arial', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000000;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .resume-container {
        max-width: 100%;
        padding: 0;
      }

      /* Typography */
      h1 {
        font-size: 24pt;
        font-weight: bold;
        margin-bottom: 8pt;
        text-transform: uppercase;
        letter-spacing: 1pt;
      }

      h2 {
        font-size: 14pt;
        font-weight: bold;
        margin-top: 16pt;
        margin-bottom: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
      }

      h3 {
        font-size: 12pt;
        font-weight: bold;
        margin-top: 8pt;
        margin-bottom: 4pt;
      }

      p {
        margin-bottom: 8pt;
        text-align: justify;
      }

      /* Lists */
      ul {
        margin-left: 18pt;
        margin-bottom: 8pt;
      }

      li {
        margin-bottom: 4pt;
        line-height: 1.5;
      }

      /* Links */
      a {
        color: #000000;
        text-decoration: none;
      }

      /* Horizontal Rules */
      hr {
        border: none;
        border-top: 1pt solid #cccccc;
        margin: 12pt 0;
      }

      /* Strong/Bold */
      strong {
        font-weight: bold;
      }

      /* Code (for technical skills) */
      code {
        font-family: 'Courier New', monospace;
        font-size: 10pt;
        background: #f5f5f5;
        padding: 1pt 3pt;
        border-radius: 2pt;
      }

      /* Page breaks */
      .page-break {
        page-break-after: always;
      }

      /* Prevent orphans and widows */
      p, li {
        orphans: 3;
        widows: 3;
      }

      h2, h3 {
        page-break-after: avoid;
      }
    `;

    // Template-specific styles
    const templates = {
      classic: `
        ${baseCSS}

        /* Classic Template: Traditional corporate style */
        body {
          font-family: 'Times New Roman', 'Georgia', serif;
        }

        h1 {
          border-bottom: 2pt solid #000000;
          padding-bottom: 8pt;
          color: #000000;
        }

        h2 {
          border-bottom: 1pt solid #666666;
          padding-bottom: 4pt;
          color: #333333;
        }

        h3 {
          color: #000000;
        }
      `,

      modern: `
        ${baseCSS}

        /* Modern Template: Clean, contemporary style */
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
        }

        h1 {
          background: linear-gradient(90deg, #2c3e50 0%, #3498db 100%);
          color: #ffffff;
          padding: 12pt;
          margin: -16pt -16pt 16pt -16pt;
        }

        h2 {
          color: #2c3e50;
          border-left: 4pt solid #3498db;
          padding-left: 8pt;
          margin-left: -12pt;
        }

        h3 {
          color: #34495e;
        }

        strong {
          color: #2c3e50;
        }
      `,

      minimal: `
        ${baseCSS}

        /* Minimal Template: Ultra-clean, scandinavian style */
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 10pt;
        }

        h1 {
          font-size: 20pt;
          font-weight: 300;
          letter-spacing: 2pt;
          margin-bottom: 4pt;
        }

        h2 {
          font-size: 12pt;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0.5pt;
          margin-top: 12pt;
          margin-bottom: 6pt;
          color: #555555;
        }

        h3 {
          font-size: 11pt;
          font-weight: 500;
          color: #333333;
        }

        hr {
          border-top: 0.5pt solid #e0e0e0;
        }

        p {
          line-height: 1.6;
        }
      `
    };

    return templates[template] || templates.classic;
  }

  /**
   * Validate template name
   */
  isValidTemplate(template) {
    return ['classic', 'modern', 'minimal'].includes(template);
  }

  /**
   * Get list of available templates with descriptions
   */
  getAvailableTemplates() {
    return [
      {
        name: 'classic',
        displayName: 'Classic',
        description: 'Traditional corporate style with Times New Roman font',
        bestFor: 'Finance, Law, Consulting, Executive positions',
        previewImage: '/templates/classic.png'
      },
      {
        name: 'modern',
        displayName: 'Modern',
        description: 'Clean contemporary design with color accents',
        bestFor: 'Tech, Startups, Creative industries, Marketing',
        previewImage: '/templates/modern.png'
      },
      {
        name: 'minimal',
        displayName: 'Minimal',
        description: 'Ultra-clean scandinavian style with generous whitespace',
        bestFor: 'Design, Architecture, Academia, Research',
        previewImage: '/templates/minimal.png'
      }
    ];
  }
}

// Export singleton
const pdfGenerator = new PDFGenerator();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing PDF generator...');
  await pdfGenerator.closeBrowser();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing PDF generator...');
  await pdfGenerator.closeBrowser();
});

module.exports = pdfGenerator;
