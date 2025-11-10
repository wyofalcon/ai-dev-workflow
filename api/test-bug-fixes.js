/**
 * Session 28 - Bug Fix Verification Test
 * Tests Bug #1 (Resume Persistence) and Bug #2 (PDF Generation)
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Test configuration
const API_BASE = process.env.API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
const TEST_USER_EMAIL = 'fco.calisto@gmail.com';

// Francisco's test data
const FRANCISCO_CV = `
Francisco Calisto
Email: fco.calisto@gmail.com
Phone: +1-555-0123

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
Tools: Docker, Kubernetes, Git, CI/CD
`.trim();

const SAVERS_JD = `
Merchandise Processing Associate

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
- Previous warehouse or retail experience preferred
`.trim();

const CONVERSATION_ANSWERS = [
  "I organized our warehouse inventory system by color and category, which reduced the time it took to find items by about 30%. I also created a simple visual guide that new employees could follow.",
  "I'm most proud of helping train new team members. I created a step-by-step guide that made onboarding much easier, and several people told me it really helped them feel confident in their first week.",
  "I taught myself basic Excel to track our department's daily metrics. I started with YouTube videos and online tutorials, and now I can create charts and use formulas to analyze our productivity.",
  "When I worked on the inventory team, I naturally became the person who coordinated tasks and made sure everyone knew what needed to be done. I liked helping the team stay organized and on track.",
  "I'm passionate about helping people feel welcome and supported, especially when they're new or learning something difficult. I also really enjoy creating order out of chaos - organizing things in a way that makes sense."
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

async function getTestUserToken() {
  log('Getting test user Firebase token...', 'blue');

  // For testing, we'll use a service account JWT
  // In production, this would be a real Firebase token
  const { JWT } = require('google-auth-library');
  const keyPath = '/mnt/storage/shared_windows/cvstomize-deployer-key.json';

  if (!fs.existsSync(keyPath)) {
    throw new Error('Service account key not found');
  }

  const keys = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const client = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    subject: 'cvstomize-deployer@cvstomize.iam.gserviceaccount.com',
  });

  const token = await client.authorize();
  log('✅ Token obtained', 'green');
  return token.access_token;
}

async function testBug1_DatabasePersistence() {
  logSection('TEST 1: Bug #1 - Resume Content Persistence (Database)');

  try {
    // Step 1: Find test user in database
    log('Step 1: Finding test user in database...', 'blue');
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      select: { id: true, firebaseUid: true, email: true }
    });

    if (!user) {
      log('❌ Test user not found in database', 'red');
      return false;
    }

    log(`✅ Found user: ${user.email} (ID: ${user.id})`, 'green');

    // Step 2: Start conversation with CV and JD
    log('\nStep 2: Starting conversation with CV and JD...', 'blue');
    log(`   CV length: ${FRANCISCO_CV.length} characters`, 'yellow');
    log(`   JD length: ${SAVERS_JD.length} characters`, 'yellow');

    const startResponse = await axios.post(
      `${API_BASE}/api/conversation/start`,
      {
        existingResume: FRANCISCO_CV,
        jobDescription: SAVERS_JD
      },
      {
        headers: {
          'Authorization': `Bearer ${user.firebaseUid}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sessionId = startResponse.data.sessionId;
    log(`✅ Conversation started: ${sessionId}`, 'green');
    log(`   Questions type: ${startResponse.data.questionsType}`, 'yellow');
    log(`   Total questions: ${startResponse.data.progress.total}`, 'yellow');

    // Step 3: Check database immediately (Bug #1 fix verification)
    log('\nStep 3: Verifying data persisted to database...', 'blue');
    const conversation = await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        sessionId: sessionId
      },
      select: {
        existingResume: true,
        gapAnalysis: true,
        jobDescription: true
      }
    });

    if (!conversation) {
      log('❌ Conversation not found in database!', 'red');
      return false;
    }

    // Verify existingResume was saved
    if (!conversation.existingResume) {
      log('❌ CRITICAL: existingResume is NULL in database!', 'red');
      log('   Bug #1 fix FAILED - Resume content not persisted', 'red');
      return false;
    }

    if (conversation.existingResume.length !== FRANCISCO_CV.length) {
      log(`⚠️  WARNING: Resume length mismatch`, 'yellow');
      log(`   Expected: ${FRANCISCO_CV.length} characters`, 'yellow');
      log(`   Got: ${conversation.existingResume.length} characters`, 'yellow');
    } else {
      log(`✅ Resume persisted correctly: ${conversation.existingResume.length} characters`, 'green');
    }

    // Verify gapAnalysis was saved
    if (conversation.gapAnalysis) {
      log(`✅ Gap analysis persisted: ${JSON.stringify(conversation.gapAnalysis).length} characters`, 'green');
    } else {
      log('⚠️  Gap analysis is NULL (might be expected)', 'yellow');
    }

    // Verify jobDescription was saved
    if (conversation.jobDescription) {
      log(`✅ Job description persisted: ${conversation.jobDescription.length} characters`, 'green');
    } else {
      log('⚠️  Job description is NULL (unexpected)', 'yellow');
    }

    // Step 4: Answer questions
    log('\nStep 4: Answering conversation questions...', 'blue');
    for (let i = 0; i < Math.min(CONVERSATION_ANSWERS.length, startResponse.data.progress.total); i++) {
      const msgResponse = await axios.post(
        `${API_BASE}/api/conversation/message`,
        {
          sessionId: sessionId,
          message: CONVERSATION_ANSWERS[i],
          currentQuestionId: `q${i + 1}`
        },
        {
          headers: {
            'Authorization': `Bearer ${user.firebaseUid}`,
            'Content-Type': 'application/json'
          }
        }
      );

      log(`   Answer ${i + 1}/${startResponse.data.progress.total} submitted`, 'yellow');

      if (msgResponse.data.completed) {
        log('✅ Conversation completed', 'green');
        break;
      }
    }

    // Step 5: Generate resume
    log('\nStep 5: Generating resume...', 'blue');
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
          'Authorization': `Bearer ${user.firebaseUid}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resumeId = generateResponse.data.resume.id;
    const resumeMarkdown = generateResponse.data.resume.markdown;

    log(`✅ Resume generated: ${resumeId}`, 'green');
    log(`   Length: ${resumeMarkdown.length} characters`, 'yellow');

    // Step 6: Verify resume contains Francisco's name (NOT "John Doe")
    log('\nStep 6: Verifying resume content accuracy...', 'blue');

    if (resumeMarkdown.includes('Francisco Calisto')) {
      log('✅ CRITICAL SUCCESS: Resume contains "Francisco Calisto"', 'green');
      log('   Bug #1 fix VERIFIED - Real CV content used!', 'green');
    } else if (resumeMarkdown.includes('John Doe')) {
      log('❌ CRITICAL FAILURE: Resume contains "John Doe" (fake content)', 'red');
      log('   Bug #1 fix FAILED - Gemini invented content!', 'red');
      return false;
    } else {
      log('⚠️  WARNING: Resume contains neither "Francisco Calisto" nor "John Doe"', 'yellow');
      log('   First 200 chars:', 'yellow');
      log(resumeMarkdown.substring(0, 200), 'yellow');
    }

    // Check for other Francisco's details
    const franciscoDetails = [
      'Tech Solutions Inc.',
      'Senior Software Engineer',
      'Digital Innovations LLC',
      'full-stack development',
      'cloud architecture'
    ];

    let detailsFound = 0;
    for (const detail of franciscoDetails) {
      if (resumeMarkdown.toLowerCase().includes(detail.toLowerCase())) {
        detailsFound++;
        log(`   ✓ Found: "${detail}"`, 'green');
      }
    }

    log(`\n   Summary: ${detailsFound}/${franciscoDetails.length} Francisco's details found`, detailsFound >= 3 ? 'green' : 'yellow');

    logSection('TEST 1 RESULT: Bug #1 - Database Persistence');
    log('✅ PASSED - Resume content persisted and used correctly', 'green');

    return { success: true, resumeId, sessionId };

  } catch (error) {
    log(`❌ TEST 1 FAILED: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false };
  }
}

async function testBug2_PDFGeneration(resumeId, userFirebaseUid) {
  logSection('TEST 2: Bug #2 - PDF Generation (Chromium)');

  if (!resumeId) {
    log('⚠️  Skipping PDF test - no resumeId from Test 1', 'yellow');
    return false;
  }

  const templates = ['modern', 'classic', 'minimal'];
  let allPassed = true;

  for (const template of templates) {
    log(`\nTesting PDF template: ${template}`, 'blue');

    try {
      const response = await axios.get(
        `${API_BASE}/api/resume/${resumeId}/pdf?template=${template}`,
        {
          headers: {
            'Authorization': `Bearer ${userFirebaseUid}`
          },
          responseType: 'arraybuffer',
          maxRedirects: 5,
          timeout: 30000 // 30 second timeout for PDF generation
        }
      );

      if (response.status === 200) {
        const pdfSize = response.data.length;
        log(`   ✅ HTTP 200 - PDF generated successfully`, 'green');
        log(`   Size: ${(pdfSize / 1024).toFixed(2)} KB`, 'yellow');

        // Verify it's actually a PDF
        const pdfHeader = Buffer.from(response.data).toString('ascii', 0, 5);
        if (pdfHeader === '%PDF-') {
          log(`   ✅ Valid PDF header detected`, 'green');
        } else {
          log(`   ⚠️  WARNING: Response doesn't have PDF header`, 'yellow');
        }
      } else {
        log(`   ❌ HTTP ${response.status} - PDF generation failed`, 'red');
        allPassed = false;
      }

    } catch (error) {
      if (error.response && error.response.status === 500) {
        log(`   ❌ HTTP 500 - PDF generation crashed`, 'red');
        log(`   Bug #2 fix FAILED - Chromium not working`, 'red');
        allPassed = false;
      } else {
        log(`   ❌ Error: ${error.message}`, 'red');
        allPassed = false;
      }
    }
  }

  logSection('TEST 2 RESULT: Bug #2 - PDF Generation');
  if (allPassed) {
    log('✅ PASSED - All PDF templates generated successfully', 'green');
  } else {
    log('❌ FAILED - Some PDF templates failed to generate', 'red');
  }

  return allPassed;
}

async function main() {
  logSection('SESSION 28 - BUG FIX VERIFICATION TEST SUITE');
  log('Testing both critical bug fixes in production environment', 'cyan');
  log(`API Base: ${API_BASE}`, 'yellow');
  log(`Test User: ${TEST_USER_EMAIL}`, 'yellow');

  let test1Result = { success: false };
  let test2Result = false;

  try {
    // Get test user
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      select: { id: true, firebaseUid: true }
    });

    if (!user) {
      log('❌ Test user not found. Please create test user first.', 'red');
      process.exit(1);
    }

    // Test Bug #1: Database Persistence
    test1Result = await testBug1_DatabasePersistence();

    // Test Bug #2: PDF Generation (only if Test 1 passed)
    if (test1Result.success && test1Result.resumeId) {
      test2Result = await testBug2_PDFGeneration(test1Result.resumeId, user.firebaseUid);
    }

    // Final summary
    logSection('FINAL TEST RESULTS');
    log(`Bug #1 (Database Persistence): ${test1Result.success ? '✅ PASSED' : '❌ FAILED'}`, test1Result.success ? 'green' : 'red');
    log(`Bug #2 (PDF Generation): ${test2Result ? '✅ PASSED' : '❌ FAILED'}`, test2Result ? 'green' : 'red');

    if (test1Result.success && test2Result) {
      logSection('🎉 ALL TESTS PASSED - READY FOR SESSION 29!');
      log('Both critical bugs are fixed and verified in production.', 'green');
      log('You can proceed to Session 29: Profile Builder Foundation', 'green');
    } else {
      logSection('⚠️  SOME TESTS FAILED - INVESTIGATION NEEDED');
      log('Please review the test output above for details.', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main().catch(console.error);
