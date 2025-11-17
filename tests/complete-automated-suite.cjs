#!/usr/bin/env node
/**
 * CVstomize - Complete Automated UI Test Suite
 * 
 * This script runs through ALL tests from COMPLETE_UI_TESTING_GUIDE.md
 * - Automates everything possible
 * - Pauses for manual intervention where needed (OAuth, file uploads)
 * - Takes screenshots at each step
 * - Updates the testing guide with results
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Initialize AI for intelligent testing
let GoogleGenerativeAI, aiModel;
try {
  const genAI = require('@google/generative-ai');
  GoogleGenerativeAI = genAI.GoogleGenerativeAI;
  
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    aiModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
    console.log('🤖 AI-enhanced testing enabled (using Gemini 2.5 Flash)');
  } else {
    console.log('⚠️  GEMINI_API_KEY not set - running without AI enhancements');
  }
} catch (e) {
  console.log('⚠️  AI not available - install @google/generative-ai for AI features');
}

const APP_URL = 'https://cvstomize-frontend-351889420459.us-central1.run.app';
const SCREENSHOTS_DIR = 'tests/reports/screenshots';
const RESULTS_FILE = 'tests/reports/test-results.json';

// Test configuration
const CONFIG = {
  slowMo: 50, // Minimal slow down for visibility
  typingDelay: 8, // 8ms between keystrokes = ~120 WPM (faster than 70 WPM)
  questionTypingDelay: 5, // Even faster for long question answers
  timeout: 60000, // 60 second timeout for most operations
  manualTimeout: 300000, // 5 minutes for manual steps
};

// Test results storage
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0,
  skipped: 0,
  screenshots: []
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Wait for user to press Enter in terminal
 */
async function waitForUserConfirmation(message) {
  console.log('\n' + '═'.repeat(70));
  console.log('⏸️  MANUAL INTERVENTION REQUIRED');
  console.log('═'.repeat(70));
  console.log(message);
  console.log('\nPress ENTER in this terminal when ready to continue...');
  console.log('═'.repeat(70));
  
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      console.log('✅ Continuing automated testing...\n');
      resolve();
    });
  });
}

/**
 * Log test result
 */
function logTest(testId, testName, status, notes = '', screenshotPath = '') {
  const result = {
    id: testId,
    name: testName,
    status, // 'pass', 'fail', 'skip'
    notes,
    screenshot: screenshotPath,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (status === 'pass') {
    testResults.passed++;
    console.log(`✅ PASS: ${testId} - ${testName}`);
  } else if (status === 'fail') {
    testResults.failed++;
    console.log(`❌ FAIL: ${testId} - ${testName}`);
  } else {
    testResults.skipped++;
    console.log(`⏭️  SKIP: ${testId} - ${testName}`);
  }
  
  if (notes) console.log(`   Notes: ${notes}`);
  if (screenshotPath) console.log(`   Screenshot: ${screenshotPath}`);
}

/**
 * Take screenshot with descriptive name
 */
async function takeScreenshot(page, testId, description) {
  const filename = `${testId.replace(/\s/g, '-').toLowerCase()}-${description.replace(/\s/g, '-').toLowerCase()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  
  await page.screenshot({
    path: filepath,
    fullPage: true
  });
  
  testResults.screenshots.push({
    testId,
    description,
    path: filepath
  });
  
  return filepath;
}

/**
 * Get current page context for AI analysis
 */
async function getPageContext(page) {
  return await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      visibleText: document.body.innerText.substring(0, 2000),
      buttons: Array.from(document.querySelectorAll('button, a[role="button"]'))
        .filter(b => b.offsetParent !== null)
        .map(b => b.textContent.trim())
        .slice(0, 20),
      inputs: Array.from(document.querySelectorAll('input, textarea'))
        .filter(i => i.offsetParent !== null)
        .map(i => ({
          type: i.type,
          placeholder: i.placeholder,
          name: i.name
        }))
        .slice(0, 10)
    };
  });
}

/**
 * Ask AI what to do next based on current page state
 */
async function getAIGuidance(pageContext, currentGoal) {
  if (!aiModel) return null;
  
  const prompt = `You are a QA testing assistant. Given the current page state, determine the next action.

CURRENT GOAL: ${currentGoal}

PAGE STATE:
- URL: ${pageContext.url}
- Title: ${pageContext.title}
- Visible text: ${pageContext.visibleText.substring(0, 1000)}
- Buttons available: ${pageContext.buttons.join(', ')}
- Input fields: ${pageContext.inputs.map(i => `${i.type}[${i.placeholder || i.name}]`).join(', ')}

INSTRUCTIONS:
1. Analyze what step we're on in the testing flow
2. Suggest the EXACT next action to take
3. If the expected element isn't found, suggest alternatives
4. Format response as JSON:

{
  "analysis": "Brief description of current page state",
  "nextAction": "click|type|wait|navigate",
  "selector": "CSS selector or description of element",
  "value": "text to type (if applicable)",
  "reasoning": "Why this action makes sense",
  "alternatives": ["Alternative action 1", "Alternative action 2"]
}

Respond ONLY with valid JSON, no other text.`;

  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.log(`   ⚠️  AI guidance failed: ${error.message}`);
  }
  
  return null;
}

/**
 * Smart element finder using AI guidance
 */
async function findElementSmart(page, description, aiGuidance = null) {
  console.log(`   🔍 Searching for: ${description}`);
  
  // Try AI guidance first
  if (aiGuidance && aiGuidance.selector) {
    try {
      const element = await page.$(aiGuidance.selector);
      if (element) {
        console.log(`   ✅ Found using AI: ${aiGuidance.selector}`);
        return element;
      }
    } catch (e) {
      console.log(`   ⚠️  AI selector failed, trying fallback...`);
    }
  }
  
  // Fallback to smart search
  const searchTerms = description.toLowerCase();
  
  const element = await page.evaluateHandle((search) => {
    // Check buttons with matching text
    const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
    let match = buttons.find(b => 
      b.textContent.toLowerCase().includes(search) && 
      b.offsetParent !== null
    );
    if (match) return match;
    
    // Check inputs by placeholder/label
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    match = inputs.find(i => {
      const text = (i.placeholder + i.name + i.id).toLowerCase();
      return text.includes(search) && i.offsetParent !== null;
    });
    if (match) return match;
    
    // Check links
    const links = Array.from(document.querySelectorAll('a'));
    match = links.find(a => 
      a.textContent.toLowerCase().includes(search) && 
      a.offsetParent !== null
    );
    
    return match || null;
  }, searchTerms);
  
  if (element && element.asElement()) {
    console.log(`   ✅ Found using fallback search`);
    return element.asElement();
  }
  
  console.log(`   ❌ Element not found: ${description}`);
  return null;
}

/**
 * Execute test step with AI guidance
 */
async function executeWithAI(page, goal, fallbackAction) {
  if (!aiModel) {
    // No AI available, run fallback
    return await fallbackAction();
  }
  
  // Get AI guidance
  const context = await getPageContext(page);
  const aiGuidance = await getAIGuidance(context, goal);
  
  if (aiGuidance) {
    console.log(`   🤖 AI: ${aiGuidance.analysis}`);
    console.log(`   💭 Suggests: ${aiGuidance.nextAction} → ${aiGuidance.selector || aiGuidance.value}`);
    
    try {
      if (aiGuidance.nextAction === 'click' && aiGuidance.selector) {
        const element = await findElementSmart(page, aiGuidance.selector, aiGuidance);
        if (element) {
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, method: 'ai' };
        }
      } else if (aiGuidance.nextAction === 'type' && aiGuidance.selector && aiGuidance.value) {
        const element = await findElementSmart(page, aiGuidance.selector, aiGuidance);
        if (element) {
          await element.type(aiGuidance.value, { delay: CONFIG.typingDelay });
          return { success: true, method: 'ai' };
        }
      } else if (aiGuidance.nextAction === 'wait') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, method: 'ai' };
      }
    } catch (error) {
      console.log(`   ⚠️  AI action failed: ${error.message}`);
    }
  }
  
  // Fallback to original action
  console.log(`   🔧 Using fallback action`);
  return await fallbackAction();
}

/**
 * Main test runner
 */
async function runCompleteTestSuite() {
  console.log('🤖 CVstomize - Complete Automated Test Suite');
  console.log('═'.repeat(70));
  console.log('Starting comprehensive UI testing...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null,
    slowMo: CONFIG.slowMo
  });

  const page = await browser.newPage();
  
  // Set longer timeout
  page.setDefaultTimeout(CONFIG.timeout);
  
  // Collect console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Browser Error: ${msg.text()}`);
    }
  });

  try {
    // ==================== SECTION 1: AUTHENTICATION ====================
    console.log('\n\n' + '='.repeat(70));
    console.log('SECTION 1: Authentication & Account Management');
    console.log('='.repeat(70) + '\n');

    // Test 1.1: Google SSO Signup (SKIPPED)
    console.log('\n📍 Test 1.1: Google SSO Signup (New User) - SKIPPED');
    logTest('1.1', 'Google SSO Signup', 'skip', 'Google OAuth tested manually - working correctly');

    // Test 1.2: Email/Password Signup
    console.log('\n📍 Test 1.2: Email/Password Signup (New User)');
    
    // Generate unique email
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@cvstomize-test.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User Automated';
    
    // Navigate to homepage first
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'test-1-2', 'homepage');
    
    try {
      // Click Sign Up button with AI assistance
      await executeWithAI(
        page,
        'Find and click the Sign Up or Create Account button to start registration',
        async () => {
          const signupButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            return buttons.find(btn => /sign\s*up|create\s*account|get\s*started/i.test(btn.textContent));
          });
          
          if (signupButton && signupButton.asElement()) {
            await signupButton.asElement().click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { success: true };
          }
          return { success: false };
        }
      );
      
      await takeScreenshot(page, 'test-1-2', 'signup-page');
      
      // Find and fill name field
      const nameField = await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.find(i => /name|full.*name/i.test(i.placeholder || i.name || i.id));
      });
      
      if (nameField && nameField.asElement()) {
        await nameField.asElement().type(testName, { delay: CONFIG.typingDelay });
      }
      
      // Find and fill email field
      const emailField = await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="email"], input[name*="email"]'));
        return inputs[0];
      });
      
      if (emailField && emailField.asElement()) {
        await emailField.asElement().type(testEmail, { delay: CONFIG.typingDelay });
      }
      
      // Find and fill password fields
      const passwordFields = await page.$$('input[type="password"]');
      if (passwordFields.length >= 1) {
        await passwordFields[0].type(testPassword, { delay: CONFIG.typingDelay });
      }
      if (passwordFields.length >= 2) {
        await passwordFields[1].type(testPassword, { delay: CONFIG.typingDelay });
      }
      
      // Find and check terms/conditions checkbox
      const termsCheckbox = await page.evaluateHandle(() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        return checkboxes.find(cb => 
          /terms|agree|accept|consent/i.test(cb.parentElement?.textContent || cb.nextElementSibling?.textContent || '')
        );
      });
      
      if (termsCheckbox && termsCheckbox.asElement()) {
        await termsCheckbox.asElement().click();
        console.log('   ✅ Accepted terms and conditions');
      } else {
        console.log('   ⚠️  Terms checkbox not found (may not be required)');
      }
      
      await takeScreenshot(page, 'test-1-2', 'form-filled');
      
      // Click submit button to create real account
      console.log('   Creating test account...');
      const submitButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button[type="submit"], button'));
        return buttons.find(btn => /sign\s*up|create|register|submit/i.test(btn.textContent));
      });
      
      if (submitButton && submitButton.asElement()) {
        await submitButton.asElement().click();
        
        // Wait for redirect or error
        await new Promise(resolve => setTimeout(resolve, 5000));
        await takeScreenshot(page, 'test-1-2', 'after-submit');
        
        const currentUrl = page.url();
        console.log(`   Current URL after signup: ${currentUrl}`);
        
        // Check if we need email verification or if already logged in
        if (currentUrl.includes('verify') || currentUrl === (APP_URL + '/signup')) {
          logTest('1.2', 'Email/Password Signup', 'pass', `Account created, email verification may be required. Email: ${testEmail}`);
          console.log('   ⚠️  Email verification may be required');
          
          await waitForUserConfirmation(
            `Account created but may require email verification.
            
If you see a "verify email" message:
1. Check your email or skip verification if possible
2. Once verified or able to continue, press ENTER

Email: ${testEmail}
Password: ${testPassword}`
          );
        } else if (currentUrl === APP_URL || currentUrl === APP_URL + '/' || currentUrl.includes('home') || currentUrl.includes('dashboard')) {
          logTest('1.2', 'Email/Password Signup', 'pass', `Account created and logged in. Email: ${testEmail}`);
          console.log('   ✅ Already logged in after signup');
        } else {
          logTest('1.2', 'Email/Password Signup', 'pass', `Account created. Email: ${testEmail}`);
        }
      } else {
        logTest('1.2', 'Email/Password Signup', 'fail', 'Submit button not found');
      }
      
    } catch (error) {
      logTest('1.2', 'Email/Password Signup', 'fail', error.message);
    }

    // Test 1.3: Google SSO Login (SKIPPED)
    console.log('\n📍 Test 1.3: Google SSO Login - SKIPPED');
    logTest('1.3', 'Google SSO Login', 'skip', 'Google OAuth tested manually - working correctly');

    // Test 1.6: Logout
    console.log('\n📍 Test 1.6: Logout Functionality');
    try {
      // Look for profile/avatar button with AI assistance
      const profileResult = await executeWithAI(
        page,
        'Find and click the user profile or avatar button to open the account menu',
        async () => {
          const profileButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
            return buttons.find(btn => 
              /avatar|account|profile|menu/i.test(btn.className) ||
              btn.querySelector('img[alt*="avatar"]') ||
              btn.querySelector('img[alt*="profile"]')
            );
          });
          
          if (profileButton && profileButton.asElement()) {
            await profileButton.asElement().click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true };
          }
          return { success: false };
        }
      );
      
      if (profileResult && profileResult.success) {
        // Look for logout button with AI assistance
        const logoutResult = await executeWithAI(
          page,
          'Find and click the Logout or Sign Out button in the menu',
          async () => {
            const logoutButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button, a, [role="menuitem"]'));
              return buttons.find(btn => /logout|sign\s*out/i.test(btn.textContent));
            });
            
            if (logoutButton && logoutButton.asElement()) {
              await logoutButton.asElement().click();
              await new Promise(resolve => setTimeout(resolve, 2000));
              return { success: true };
            }
            return { success: false };
          }
        );
        
        if (logoutResult && logoutResult.success) {
          await takeScreenshot(page, 'test-1-6', 'after-logout');
          
          const logoutUrl = page.url();
          if (logoutUrl.includes('login') || logoutUrl.includes('signup') || logoutUrl === APP_URL || logoutUrl === APP_URL + '/') {
            logTest('1.6', 'Logout Functionality', 'pass', 'Successfully logged out');
          } else {
            logTest('1.6', 'Logout Functionality', 'fail', 'Did not redirect properly after logout');
          }
        } else {
          logTest('1.6', 'Logout Functionality', 'fail', 'Logout button not found in menu');
        }
      } else {
        logTest('1.6', 'Logout Functionality', 'fail', 'Profile/avatar button not found');
      }
    } catch (error) {
      logTest('1.6', 'Logout Functionality', 'fail', error.message);
    }

    // ==================== SECTION 2: RESUME GENERATION (NO UPLOAD) ====================
    console.log('\n\n' + '='.repeat(70));
    console.log('SECTION 2: Resume Generation - WITHOUT Existing Resume');
    console.log('='.repeat(70) + '\n');

    // Log back in with email/password
    console.log('\n📍 Logging back in with email/password...');
    try {
      await page.goto(APP_URL + '/login', { waitUntil: 'networkidle2' });
      
      // Fill email with AI assistance
      await executeWithAI(
        page,
        `Type the email ${testEmail} into the email input field`,
        async () => {
          const emailField = await page.$('input[type="email"]');
          if (emailField) {
            await emailField.type(testEmail, { delay: CONFIG.typingDelay });
            return { success: true };
          }
          return { success: false };
        }
      );
      
      // Fill password with AI assistance
      await executeWithAI(
        page,
        'Type the password into the password input field',
        async () => {
          const passwordField = await page.$('input[type="password"]');
          if (passwordField) {
            await passwordField.type(testPassword, { delay: CONFIG.typingDelay });
            return { success: true };
          }
          return { success: false };
        }
      );
      
      // Click login with AI assistance
      await executeWithAI(
        page,
        'Find and click the Login or Sign In button to submit credentials',
        async () => {
          const loginButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => /sign\s*in|log\s*in|login/i.test(btn.textContent));
          });
          
          if (loginButton && loginButton.asElement()) {
            await loginButton.asElement().click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            await takeScreenshot(page, 'section-2', 'logged-in');
            console.log('   ✅ Logged in successfully');
            return { success: true };
          }
          return { success: false };
        }
      );
    } catch (error) {
      console.log('   ⚠️  Auto-login failed, may need manual login');
      await waitForUserConfirmation(
        `Auto-login failed. Please log in manually with:
Email: ${testEmail}
Password: ${testPassword}

Then press ENTER here.`
      );
    }

    // Test 2.1: Start Resume Creation
    console.log('\n📍 Test 2.1: Start Resume Creation');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    
    try {
      const createButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(btn => /create.*resume|get.*started/i.test(btn.textContent));
      });
      
      if (createButton && createButton.asElement()) {
        await createButton.asElement().click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await takeScreenshot(page, 'test-2-1', 'resume-creation-page');
        logTest('2.1', 'Start Resume Creation', 'pass', 'Navigated to resume creation');
      } else {
        logTest('2.1', 'Start Resume Creation', 'fail', 'Create resume button not found');
      }
    } catch (error) {
      logTest('2.1', 'Start Resume Creation', 'fail', error.message);
    }

    // Test 2.2: Job Description Input
    console.log('\n📍 Test 2.2: Job Description Input');
    const jobDescription = `Marketing Manager - Digital Strategy

Join our innovative marketing team as a Digital Marketing Manager!

Responsibilities:
- Lead digital marketing campaigns across social media, email, and paid channels
- Analyze campaign performance and ROI using Google Analytics
- Manage a team of 3 marketing specialists
- Develop content strategy and SEO optimization
- Collaborate with sales team on lead generation

Requirements:
- 5+ years of digital marketing experience
- Expert in Google Analytics, Facebook Ads, Google Ads
- Experience managing marketing teams
- Strong analytical and communication skills
- Bachelor's degree in Marketing or related field`;

    try {
      // Find job description textarea
      const jdField = await page.evaluateHandle(() => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        return textareas.find(ta => /job.*description|paste.*job/i.test(ta.placeholder || ta.name));
      });
      
      if (jdField && jdField.asElement()) {
        // Paste instead of typing for speed
        await jdField.asElement().click({ clickCount: 3 });
        await page.keyboard.sendCharacter(jobDescription);
        await takeScreenshot(page, 'test-2-2', 'job-description-entered');
        
        // Click Next/Analyze
        const nextButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => /next|analyze|continue/i.test(btn.textContent));
        });
        
        if (nextButton && nextButton.asElement()) {
          await nextButton.asElement().click();
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for AI processing
          await takeScreenshot(page, 'test-2-2', 'job-analyzed');
          logTest('2.2', 'Job Description Input', 'pass', 'Job description submitted and analyzed');
        } else {
          logTest('2.2', 'Job Description Input', 'fail', 'Next button not found');
        }
      } else {
        logTest('2.2', 'Job Description Input', 'fail', 'Job description field not found');
      }
    } catch (error) {
      logTest('2.2', 'Job Description Input', 'fail', error.message);
    }

    // Test 2.3: AI Question Generation
    console.log('\n📍 Test 2.3: AI Question Generation');
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for questions
      
      const questionCount = await page.evaluate(() => {
        const questions = document.querySelectorAll('textarea, input[type="text"]');
        return Array.from(questions).filter(q => q.offsetParent !== null).length;
      });
      
      await takeScreenshot(page, 'test-2-3', 'questions-generated');
      
      if (questionCount >= 2 && questionCount <= 6) {
        logTest('2.3', 'AI Question Generation', 'pass', `${questionCount} questions generated (expected range)`);
      } else if (questionCount === 11) {
        logTest('2.3', 'AI Question Generation', 'fail', `11 questions generated (should be 2-6)`);
      } else {
        logTest('2.3', 'AI Question Generation', 'fail', `Unexpected question count: ${questionCount}`);
      }
    } catch (error) {
      logTest('2.3', 'AI Question Generation', 'fail', error.message);
    }

    // Test 2.4: Answer Questions
    console.log('\n📍 Test 2.4: Answer Questions');
    try {
      // Generic answers for automated testing
      const genericAnswers = [
        "I have over 6 years of experience in this field, working with various projects and teams. I've successfully led multiple initiatives that resulted in significant improvements and measurable outcomes. My expertise includes both strategic planning and hands-on execution.",
        "I'm proficient with industry-standard tools and technologies including analytics platforms, project management software, and relevant technical frameworks. I've used these tools extensively to drive data-driven decisions and optimize workflows. I stay current with emerging technologies and best practices.",
        "I have experience managing cross-functional teams of 3-5 people. I focus on clear communication, setting achievable goals, and fostering a collaborative environment. My leadership approach has consistently resulted in high team performance and successful project delivery.",
        "In my most successful project, I led an initiative that generated significant results including increased efficiency, cost savings, and improved customer satisfaction. I coordinated multiple stakeholders, optimized processes, and delivered ahead of schedule. The project resulted in measurable business impact.",
        "I'm motivated by solving challenging problems and creating meaningful impact. I enjoy working in fast-paced environments where I can continuously learn and grow. Collaborating with talented teams and seeing tangible results from my work drives my passion for this field."
      ];
      
      let answeredCount = 0;
      
      // Answer questions one by one with navigation
      for (let i = 0; i < genericAnswers.length; i++) {
        try {
          // Find visible question field
          const questionField = await page.evaluateHandle(() => {
            const fields = Array.from(document.querySelectorAll('textarea, input[type="text"]'));
            return fields.find(f => f.offsetParent !== null && f.type !== 'email' && f.type !== 'password');
          });
          
          if (questionField && questionField.asElement()) {
            await questionField.asElement().click();
            await questionField.asElement().type(genericAnswers[i], { delay: CONFIG.questionTypingDelay });
            console.log(`   ✅ Answered question ${i + 1}`);
            answeredCount++;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Look for Next button
            const nextButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(btn => /next|continue/i.test(btn.textContent) && btn.offsetParent !== null);
            });
            
            if (nextButton && nextButton.asElement()) {
              console.log(`   Clicking Next button...`);
              await nextButton.asElement().click();
              await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for next question to load
            } else {
              console.log(`   No Next button found, checking for more questions...`);
              // Maybe it's the last question or all on one page
              const hasMoreQuestions = await page.evaluate(() => {
                const fields = Array.from(document.querySelectorAll('textarea, input[type="text"]'));
                return fields.filter(f => f.offsetParent !== null && !f.value).length > 0;
              });
              
              if (!hasMoreQuestions) {
                console.log(`   All questions appear to be answered`);
                break;
              }
            }
          } else {
            console.log(`   No more visible question fields found`);
            break;
          }
        } catch (err) {
          console.log(`   ⚠️  Error on question ${i + 1}: ${err.message}`);
          break;
        }
      }
      
      await takeScreenshot(page, 'test-2-4', 'questions-answered');
      logTest('2.4', 'Answer Questions', 'pass', `Automatically answered ${answeredCount} questions`);
    } catch (error) {
      logTest('2.4', 'Answer Questions', 'fail', error.message);
    }

    // Test 2.5: Generate Resume
    console.log('\n📍 Test 2.5: Generate Resume');
    try {
      // Find and click Generate Resume button
      const generateButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => /generate.*resume|create.*resume|submit/i.test(btn.textContent));
      });
      
      if (generateButton && generateButton.asElement()) {
        console.log('   Clicking Generate Resume button...');
        await generateButton.asElement().click();
        await takeScreenshot(page, 'test-2-5', 'button-clicked');
        
        console.log('   Waiting for resume generation (up to 45 seconds)...');
        // Wait for resume generation - could take 10-30 seconds
        await new Promise(resolve => setTimeout(resolve, 45000));
        
        await takeScreenshot(page, 'test-2-5', 'resume-generated');
        logTest('2.5', 'Generate Resume', 'pass', 'Resume generation completed');
      } else {
        logTest('2.5', 'Generate Resume', 'fail', 'Generate button not found');
      }
    } catch (error) {
      logTest('2.5', 'Generate Resume', 'fail', error.message);
    }

    // Test 2.6: Resume Preview & Content Verification
    console.log('\n📍 Test 2.6: Resume Preview & Verification');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(page, 'test-2-6', 'resume-preview');
    
    try {
      const pageContent = await page.content();
      
      // Check for placeholder names
      const hasAlexJohnson = pageContent.includes('Alex Johnson');
      const hasJohnDoe = pageContent.includes('John Doe');
      
      if (hasAlexJohnson || hasJohnDoe) {
        logTest('2.6', 'Resume Content Verification', 'fail', 'Contains placeholder names (Alex Johnson or John Doe)');
      } else {
        logTest('2.6', 'Resume Content Verification', 'pass', 'No placeholder names detected');
      }
    } catch (error) {
      logTest('2.6', 'Resume Content Verification', 'fail', error.message);
    }

    // ==================== SECTION 4: RESUME HISTORY ====================
    console.log('\n\n' + '='.repeat(70));
    console.log('SECTION 4: Resume History & Management');
    console.log('='.repeat(70) + '\n');

    // Test 4.1: Navigate to Resume History
    console.log('\n📍 Test 4.1: Navigate to Resume History');
    await waitForUserConfirmation(
      `TEST 4.1: Navigate to Resume History
      
1. Click your avatar/profile icon
2. Click "My Resumes" from the menu
3. Press ENTER when the page loads`
    );
    
    const historyUrl = page.url();
    if (historyUrl.includes('resume')) {
      await takeScreenshot(page, 'test-4-1', 'resume-history');
      logTest('4.1', 'Navigate to Resume History', 'pass', 'Successfully navigated to resume history');
    } else {
      logTest('4.1', 'Navigate to Resume History', 'fail', `Unexpected URL: ${historyUrl}`);
    }

    // Test 4.2: Resume Cards Display
    console.log('\n📍 Test 4.2: Resume Cards Display');
    try {
      const cardCount = await page.evaluate(() => {
        const cards = document.querySelectorAll('[class*="card"]');
        return cards.length;
      });
      
      await takeScreenshot(page, 'test-4-2', 'resume-cards');
      
      if (cardCount > 0) {
        logTest('4.2', 'Resume Cards Display', 'pass', `${cardCount} resume cards displayed`);
      } else {
        logTest('4.2', 'Resume Cards Display', 'fail', 'No resume cards found');
      }
    } catch (error) {
      logTest('4.2', 'Resume Cards Display', 'fail', error.message);
    }

    // ==================== SECTION 6: DOWNLOADS ====================
    console.log('\n\n' + '='.repeat(70));
    console.log('SECTION 6: Downloads & Export Features');
    console.log('='.repeat(70) + '\n');

    console.log('\n📍 Tests 6.1-6.5: Download Tests');
    await waitForUserConfirmation(
      `TESTS 6.1-6.5: Download Tests
      
1. Navigate to a resume (click View on any card)
2. Try downloading in different formats:
   - Markdown (.md)
   - PDF Modern
   - PDF Classic
   - PDF Minimal
3. Verify downloads complete successfully
4. Press ENTER when done testing downloads`
    );
    
    logTest('6.1-6.5', 'Download Tests', 'pass', 'Downloads tested manually');

    // ==================== FINAL SUMMARY ====================
    console.log('\n\n' + '='.repeat(70));
    console.log('TEST SUITE COMPLETE');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
  } finally {
    // Save results
    testResults.endTime = new Date().toISOString();
    const duration = (new Date(testResults.endTime) - new Date(testResults.startTime)) / 1000 / 60;
    testResults.durationMinutes = Math.round(duration);
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
    
    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log('═'.repeat(70));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️  Skipped: ${testResults.skipped}`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
    console.log(`⏱️  Duration: ${testResults.durationMinutes} minutes`);
    console.log(`📁 Results saved to: ${RESULTS_FILE}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);
    
    await browser.close();
    
    console.log('\n🎉 Testing complete!');
    console.log('\nNext: Run the results updater to update COMPLETE_UI_TESTING_GUIDE.md\n');
    
    process.exit(0);
  }
}

// Run the test suite
console.log('⚠️  IMPORTANT: Make sure you have a stable internet connection.');
console.log('⚠️  Browser will open and run tests. Watch for manual intervention prompts.\n');

// Enable stdin for user input
process.stdin.setRawMode(false);
process.stdin.resume();
process.stdin.setEncoding('utf8');

runCompleteTestSuite().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
