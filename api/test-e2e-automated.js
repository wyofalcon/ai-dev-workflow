/**
 * Session 28 - End-to-End Automated API Test
 * Tests complete flow via API: Upload → Conversation → Generation → Download
 */

const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const API_BASE = 'https://cvstomize-api-351889420459.us-central1.run.app';

// Francisco's test data
const FRANCISCO_CV = `Francisco Calisto
Senior Software Engineer
Email: fco.calisto@gmail.com | Phone: +1-555-0123

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development,
cloud architecture, and AI/ML integration. Proven track record of delivering scalable
solutions for enterprise clients.

EXPERIENCE

Senior Software Engineer | Tech Solutions Inc. | 2021-Present
- Led development of cloud-native microservices architecture serving 1M+ users
- Implemented AI-powered recommendation engine using Python and TensorFlow
- Reduced infrastructure costs by 40% through AWS optimization
- Mentored team of 5 junior developers

Software Engineer | Digital Innovations LLC | 2019-2021
- Built RESTful APIs using Node.js and Express for e-commerce platform
- Designed and implemented PostgreSQL database schemas
- Integrated payment processing (Stripe, PayPal) with 99.9% uptime
- Automated deployment pipelines using Docker and GitHub Actions

EDUCATION
Bachelor of Science in Computer Science | University of California | 2019

SKILLS
Languages: JavaScript, Python, TypeScript, SQL
Frameworks: React, Node.js, Express, Flask, Django
Cloud: AWS (EC2, Lambda, S3, RDS), Google Cloud Platform
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, Kubernetes, Git, CI/CD`;

const SAVERS_JD = `Merchandise Processing Associate

Job Description:
Savers is looking for a Merchandise Processing Associate to join our team.

Responsibilities:
- Sort and process donated items efficiently
- Organize merchandise by category and quality
- Maintain clean and organized work area
- Assist with pricing and tagging items
- Work as part of a team to meet daily processing goals
- Lift and move items up to 50 lbs

Requirements:
- High school diploma or equivalent
- Ability to stand for extended periods
- Strong attention to detail
- Good organizational skills
- Team player with positive attitude
- Previous warehouse or retail experience preferred`;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

async function getFirebaseToken() {
  log('Getting Firebase token for test user...', 'blue');

  // Get test user's Firebase UID from database
  const { stdout } = await execPromise(
    `PGPASSWORD='CVstomize_Fresh_2025_2157' psql -h 127.0.0.1 -p 5435 -U cvstomize_app -d cvstomize_production -t -c "SELECT firebase_uid FROM users WHERE email = 'fco.calisto@gmail.com' LIMIT 1;"`
  );

  const firebaseUid = stdout.trim();
  if (!firebaseUid) {
    throw new Error('Test user not found in database');
  }

  log(`✅ Test user Firebase UID: ${firebaseUid.substring(0, 20)}...`, 'green');
  return firebaseUid;
}

async function testCompleteFlow() {
  logSection('END-TO-END AUTOMATED TEST - Complete Resume Generation Flow');

  let sessionId = null;
  let resumeId = null;
  const token = await getFirebaseToken();

  try {
    // STEP 1: Start conversation with CV and JD
    logSection('STEP 1: Start Conversation (POST /api/conversation/start)');
    log('Payload:', 'blue');
    log(`  - existingResume: ${FRANCISCO_CV.length} characters`, 'yellow');
    log(`  - jobDescription: ${SAVERS_JD.length} characters`, 'yellow');

    const startResponse = await axios.post(
      `${API_BASE}/api/conversation/start`,
      {
        existingResume: FRANCISCO_CV,
        jobDescription: SAVERS_JD
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    sessionId = startResponse.data.sessionId;
    log(`✅ Conversation started`, 'green');
    log(`   Session ID: ${sessionId}`, 'yellow');
    log(`   Questions type: ${startResponse.data.questionsType}`, 'yellow');
    log(`   Total questions: ${startResponse.data.progress.total}`, 'yellow');

    // STEP 1.5: Verify database persistence immediately
    logSection('STEP 1.5: Verify Resume Persisted to Database (BUG #1 CHECK)');
    const { stdout: dbCheck } = await execPromise(
      `PGPASSWORD='CVstomize_Fresh_2025_2157' psql -h 127.0.0.1 -p 5435 -U cvstomize_app -d cvstomize_production -t -c "SELECT LENGTH(existing_resume), LENGTH(job_description) FROM conversations WHERE session_id = '${sessionId}';"`
    );

    const [resumeLength, jdLength] = dbCheck.trim().split('|').map(s => parseInt(s.trim()));

    if (resumeLength > 0) {
      log(`✅ CRITICAL: Resume persisted to database!`, 'green');
      log(`   Resume length in DB: ${resumeLength} characters`, 'yellow');
      log(`   Job description length in DB: ${jdLength} characters`, 'yellow');
      log(`   🎉 BUG #1 FIX VERIFIED - Data saved to DB (not volatile Map)`, 'green');
    } else {
      log(`❌ CRITICAL FAILURE: Resume NOT persisted to database!`, 'red');
      log(`   BUG #1 FIX FAILED - Data not saved`, 'red');
      return false;
    }

    // STEP 2: Answer questions
    logSection('STEP 2: Answer Questions (POST /api/conversation/message)');
    const answers = [
      "I organized our warehouse inventory by color and category, reducing search time by 30%.",
      "I'm proud of creating a training guide that helped new team members onboard faster.",
      "I taught myself Excel through YouTube tutorials to track our department metrics.",
      "I naturally coordinated tasks and kept the team organized and on track.",
      "I'm passionate about helping people and creating order out of chaos."
    ];

    for (let i = 0; i < Math.min(answers.length, startResponse.data.progress.total); i++) {
      const msgResponse = await axios.post(
        `${API_BASE}/api/conversation/message`,
        {
          sessionId: sessionId,
          message: answers[i],
          currentQuestionId: `q${i + 1}`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      log(`   ✓ Answer ${i + 1}/${startResponse.data.progress.total} submitted`, 'yellow');

      if (msgResponse.data.completed) {
        log(`✅ Conversation completed after ${i + 1} questions`, 'green');
        break;
      }
    }

    // STEP 3: Generate resume
    logSection('STEP 3: Generate Resume (POST /api/resume/generate)');
    log('This is the critical test - will it use Francisco\'s CV or invent "John Doe"?', 'blue');

    const generateResponse = await axios.post(
      `${API_BASE}/api/resume/generate`,
      {
        sessionId: sessionId,
        title: 'Francisco Calisto - Merchandise Processing Associate Resume',
        jobDescription: SAVERS_JD,
        selectedSections: 'experience,skills,summary'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds for Gemini generation
      }
    );

    resumeId = generateResponse.data.resume.id;
    const resumeMarkdown = generateResponse.data.resume.markdown;

    log(`✅ Resume generated`, 'green');
    log(`   Resume ID: ${resumeId}`, 'yellow');
    log(`   Length: ${resumeMarkdown.length} characters`, 'yellow');

    // STEP 3.5: Verify resume content (CRITICAL TEST)
    logSection('STEP 3.5: Verify Resume Content (BUG #1 FINAL CHECK)');
    log('Checking if resume contains Francisco\'s real data or invented "John Doe"...', 'blue');

    let criticalTestPassed = false;

    if (resumeMarkdown.includes('Francisco Calisto') || resumeMarkdown.includes('Francisco')) {
      log(`✅ SUCCESS: Resume contains "Francisco Calisto"`, 'green');
      criticalTestPassed = true;
    } else if (resumeMarkdown.includes('John Doe')) {
      log(`❌ FAILURE: Resume contains "John Doe" (invented content)`, 'red');
      log(`   BUG #1 NOT FIXED - Gemini still inventing content`, 'red');
      criticalTestPassed = false;
    } else {
      log(`⚠️  WARNING: Resume contains neither "Francisco" nor "John Doe"`, 'yellow');
      log(`   First 300 characters:`, 'yellow');
      log(resumeMarkdown.substring(0, 300), 'yellow');
    }

    // Check for Francisco's real experience
    const franciscoKeywords = [
      'Tech Solutions',
      'Digital Innovations',
      'Senior Software Engineer',
      'cloud-native',
      'microservices'
    ];

    let keywordsFound = 0;
    log('\nChecking for Francisco\'s real experience keywords:', 'blue');
    for (const keyword of franciscoKeywords) {
      if (resumeMarkdown.toLowerCase().includes(keyword.toLowerCase())) {
        log(`   ✓ Found: "${keyword}"`, 'green');
        keywordsFound++;
      } else {
        log(`   ✗ Missing: "${keyword}"`, 'yellow');
      }
    }

    log(`\nKeyword match: ${keywordsFound}/${franciscoKeywords.length}`, keywordsFound >= 2 ? 'green' : 'yellow');

    if (!criticalTestPassed) {
      log('\n❌ BUG #1 TEST FAILED - Resume content is wrong', 'red');
      return false;
    }

    // STEP 4: Test PDF generation
    logSection('STEP 4: Test PDF Generation (BUG #2 CHECK)');
    const templates = ['modern', 'classic', 'minimal'];
    let allPDFsPassed = true;

    for (const template of templates) {
      log(`\nTesting PDF template: ${template}`, 'blue');

      try {
        const pdfResponse = await axios.get(
          `${API_BASE}/api/resume/${resumeId}/pdf?template=${template}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            responseType: 'arraybuffer',
            timeout: 30000
          }
        );

        if (pdfResponse.status === 200) {
          const pdfSize = pdfResponse.data.length;
          log(`   ✅ HTTP 200 - PDF generated`, 'green');
          log(`   Size: ${(pdfSize / 1024).toFixed(2)} KB`, 'yellow');

          // Verify PDF header
          const pdfHeader = Buffer.from(pdfResponse.data).toString('ascii', 0, 5);
          if (pdfHeader === '%PDF-') {
            log(`   ✅ Valid PDF file`, 'green');
          } else {
            log(`   ⚠️  Invalid PDF header`, 'yellow');
          }
        } else {
          log(`   ❌ HTTP ${pdfResponse.status}`, 'red');
          allPDFsPassed = false;
        }
      } catch (error) {
        if (error.response?.status === 500) {
          log(`   ❌ HTTP 500 - Chromium crashed`, 'red');
          log(`   BUG #2 NOT FIXED`, 'red');
          allPDFsPassed = false;
        } else {
          log(`   ❌ Error: ${error.message}`, 'red');
          allPDFsPassed = false;
        }
      }
    }

    // STEP 5: Test markdown download
    logSection('STEP 5: Test Markdown Download');
    try {
      const mdResponse = await axios.get(
        `${API_BASE}/api/resume/${resumeId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (mdResponse.status === 200) {
        log(`✅ Markdown download working`, 'green');
        log(`   Content-Type: ${mdResponse.headers['content-type']}`, 'yellow');
      }
    } catch (error) {
      log(`⚠️  Markdown download error: ${error.message}`, 'yellow');
    }

    // FINAL RESULTS
    logSection('🎯 FINAL TEST RESULTS');

    log(`\nBug #1 (Resume Persistence):`, 'cyan');
    log(`  ✅ Database persistence: WORKING`, 'green');
    log(`  ${criticalTestPassed ? '✅' : '❌'} Resume content accuracy: ${criticalTestPassed ? 'WORKING' : 'FAILED'}`, criticalTestPassed ? 'green' : 'red');

    log(`\nBug #2 (PDF Generation):`, 'cyan');
    log(`  ${allPDFsPassed ? '✅' : '❌'} PDF generation: ${allPDFsPassed ? 'WORKING' : 'FAILED'}`, allPDFsPassed ? 'green' : 'red');

    if (criticalTestPassed && allPDFsPassed) {
      logSection('🎉 ALL TESTS PASSED - BUGS FIXED!');
      log('Both critical bugs are verified fixed in production.', 'green');
      log('\nYou can now test the GUI at:', 'cyan');
      log('https://cvstomize-frontend-351889420459.us-central1.run.app', 'blue');
      log('\nExpected behavior:', 'yellow');
      log('  1. Upload any CV with YOUR name', 'yellow');
      log('  2. Paste any job description', 'yellow');
      log('  3. Answer the questions', 'yellow');
      log('  4. Generate resume', 'yellow');
      log('  5. Resume should show YOUR name (not "John Doe")', 'yellow');
      log('  6. All 4 downloads should work (MD + 3 PDFs)', 'yellow');
      return true;
    } else {
      logSection('⚠️  SOME TESTS FAILED');
      if (!criticalTestPassed) {
        log('❌ Bug #1 (Resume Persistence) - Resume content still wrong', 'red');
      }
      if (!allPDFsPassed) {
        log('❌ Bug #2 (PDF Generation) - PDFs still failing', 'red');
      }
      return false;
    }

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

// Run test
testCompleteFlow().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
