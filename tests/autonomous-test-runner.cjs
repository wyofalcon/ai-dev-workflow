#!/usr/bin/env node
/**
 * Autonomous Testing System with Gemini AI
 * 
 * Features:
 * - Runs tests autonomously from a checklist
 * - Uses Gemini AI to adapt to UI changes
 * - Updates test progress in real-time
 * - Pauses for human intervention when needed
 * - Resumes from last checkpoint
 * - Generates detailed reports
 * 
 * Usage:
 *   node tests/autonomous-test-runner.cjs              # Run all pending tests
 *   node tests/autonomous-test-runner.cjs --resume     # Resume from last checkpoint
 *   node tests/autonomous-test-runner.cjs --test 2.1   # Run specific test
 *   node tests/autonomous-test-runner.cjs --category authentication  # Run category
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Check for Google AI SDK
let GoogleGenerativeAI;
try {
  const genAI = require('@google/generative-ai');
  GoogleGenerativeAI = genAI.GoogleGenerativeAI;
} catch (e) {
  console.error('❌ Google Generative AI not installed.');
  console.error('   Install with: npm install @google/generative-ai');
  process.exit(1);
}

// Configuration
const CONFIG = {
  APP_URL: process.env.TEST_URL || 'http://localhost:3000',
  PROGRESS_FILE: path.join(__dirname, 'test-progress.json'),
  SCREENSHOTS_DIR: path.join(__dirname, 'reports', 'screenshots'),
  REPORTS_DIR: path.join(__dirname, 'reports'),
  HEADLESS: process.env.HEADLESS !== 'false',
  SLOW_MO: parseInt(process.env.SLOW_MO || '0'),
  GEMINI_MODEL: 'gemini-2.0-flash-exp', // Latest experimental model
};

// Test data
const TEST_DATA = {
  jobDescription: {
    marketing: `Marketing Manager - Digital Strategy

Join our innovative marketing team as a Digital Marketing Manager!

Responsibilities:
- Lead digital marketing campaigns across social media, email, and paid channels
- Analyze campaign performance and ROI using Google Analytics
- Manage a team of 3 marketing specialists
- Develop content strategy and SEO optimization

Requirements:
- 5+ years of digital marketing experience
- Expert in Google Analytics, Facebook Ads, Google Ads
- Experience managing marketing teams
- Strong analytical and communication skills`,
    
    engineer: `Senior Software Engineer - Backend

Seeking experienced backend engineer for platform team.

Responsibilities:
- Design scalable microservices using Node.js and Python
- Optimize database performance (PostgreSQL, MongoDB)
- Implement RESTful APIs and GraphQL endpoints
- Write comprehensive tests and documentation

Requirements:
- 5+ years backend development experience
- Expert in Node.js or Python
- Strong SQL and NoSQL database skills
- Experience with Docker and Kubernetes`
  },
  
  answers: {
    marketing: [
      "I've led digital marketing campaigns for 6 years across SaaS and e-commerce companies. I managed budgets of $50K-200K/month across Facebook Ads, Google Ads, and LinkedIn. My campaigns consistently achieved 3-5x ROAS through A/B testing.",
      "I use Google Analytics daily to track user behavior and conversion funnels. I've built custom dashboards in Google Data Studio and use Facebook Pixel for retargeting. Data-driven decision making is core to my approach.",
      "I currently manage a team of 3 marketing specialists. I hold weekly 1-on-1s, set clear OKRs, and foster a collaborative culture. Last year, my team exceeded lead generation goals by 40%.",
      "I launched a multi-channel campaign that generated 5,000 qualified leads in 30 days. By optimizing ad creative and targeting, we reduced cost-per-lead by 60%. The campaign resulted in $500K in new revenue.",
      "I love the creativity and data science blend in marketing. Seeing campaigns drive real business results is rewarding. I'm motivated by challenging goals and continuous learning."
    ]
  },
  
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'automated-test@cvstomize.test',
    password: process.env.TEST_USER_PASSWORD || 'AutoTest123!',
    name: 'Autonomous Test User',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/testuser'
  }
};

// Helper function for delays (Puppeteer-compatible)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize AI
let aiModel = null;
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  aiModel = genAI.getGenerativeModel({ 
    model: CONFIG.GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 0.95,
      topK: 40,
    }
  });
  console.log(`✅ AI-enhanced testing enabled (${CONFIG.GEMINI_MODEL})\n`);
} else {
  console.error('❌ GEMINI_API_KEY environment variable not set');
  console.error('   Set it with: export GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

/**
 * Test Progress Manager
 */
class TestProgressManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
  }
  
  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load progress file:', error.message);
      throw error;
    }
  }
  
  async save() {
    try {
      await fs.writeFile(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save progress file:', error.message);
    }
  }
  
  getNextPendingTest() {
    for (const [category, tests] of Object.entries(this.data.tests)) {
      for (const [testId, test] of Object.entries(tests)) {
        if (test.status === 'not-started' || test.status === 'running') {
          return { category, testId, test };
        }
      }
    }
    return null;
  }
  
  getTest(category, testId) {
    return this.data.tests[category]?.[testId];
  }
  
  updateTest(category, testId, updates) {
    if (this.data.tests[category] && this.data.tests[category][testId]) {
      Object.assign(this.data.tests[category][testId], updates);
      this.data.lastRun = new Date().toISOString();
      this.data.currentTest = `${category}.${testId}`;
    }
  }
  
  async markStarted(category, testId) {
    this.updateTest(category, testId, {
      status: 'running',
      lastAttempt: new Date().toISOString()
    });
    await this.save();
  }
  
  async markCompleted(category, testId, result, notes = '') {
    this.updateTest(category, testId, {
      status: 'completed',
      result: result, // 'pass', 'fail', or 'undetermined'
      notes: notes
    });
    await this.save();
  }
  
  async markFailed(category, testId, error, requiresHuman = false) {
    this.updateTest(category, testId, {
      status: requiresHuman ? 'needs-human' : 'failed',
      result: 'fail',
      notes: error
    });
    await this.save();
  }
  
  getStats() {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let undetermined = 0;
    let notStarted = 0;
    let needsHuman = 0;
    
    for (const tests of Object.values(this.data.tests)) {
      for (const test of Object.values(tests)) {
        total++;
        if (test.status === 'completed') {
          if (test.result === 'pass') passed++;
          else if (test.result === 'fail') failed++;
          else if (test.result === 'undetermined') undetermined++;
        } else if (test.status === 'not-started') {
          notStarted++;
        } else if (test.status === 'needs-human') {
          needsHuman++;
        }
      }
    }
    
    return { total, passed, failed, undetermined, notStarted, needsHuman };
  }
}

/**
 * AI Test Assistant
 */
class AITestAssistant {
  constructor(model) {
    this.model = model;
  }
  
  async getPageContext(page) {
    return await page.evaluate(() => {
      const getVisibleText = () => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              const style = window.getComputedStyle(parent);
              if (style.display === 'none' || style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT;
              }
              return node.textContent.trim().length > 0
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
            }
          }
        );
        
        const texts = [];
        let node;
        while (node = walker.nextNode()) {
          texts.push(node.textContent.trim());
        }
        return texts.join(' ').substring(0, 3000);
      };
      
      return {
        url: window.location.href,
        title: document.title,
        visibleText: getVisibleText(),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()),
        inputs: Array.from(document.querySelectorAll('input, textarea')).map(i => 
          `${i.type || 'text'}: ${i.placeholder || i.name || i.id || 'unnamed'}`
        ),
        errors: Array.from(document.querySelectorAll('[role="alert"], .error, .error-message'))
          .map(e => e.textContent.trim()),
      };
    });
  }
  
  async getGuidance(pageContext, testGoal, previousActions = []) {
    const prompt = `You are an expert QA automation assistant testing CVStomize (resume builder app).

CURRENT TEST GOAL: ${testGoal}

TEST CREDENTIALS (USE THESE FOR LOGIN):
- Email: ${TEST_DATA.testUser.email}
- Password: ${TEST_DATA.testUser.password}

CURRENT PAGE STATE:
- URL: ${pageContext.url}
- Title: ${pageContext.title}
- Visible text (first 500 chars): ${pageContext.visibleText.substring(0, 500)}
- Available buttons: ${pageContext.buttons.slice(0, 10).join(', ')}
- Input fields: ${pageContext.inputs.slice(0, 10).join(', ')}
- Errors shown: ${pageContext.errors.join(', ') || 'None'}

PREVIOUS ACTIONS IN THIS TEST: ${previousActions.length > 0 ? previousActions.join(' → ') : 'None (first action)'}

YOUR TASK:
1. Analyze the current page state
2. Determine the NEXT specific action to achieve the test goal
3. Provide the exact selector or element description
4. If the expected element isn't found, suggest alternatives
5. Indicate if human intervention is needed

RESPONSE FORMAT (valid JSON only):
{
  "analysis": "Brief analysis of current state",
  "nextAction": "click|type|navigate|wait|verify|human-needed",
  "target": "CSS selector or description of element",
  "value": "text to type (if action is 'type')",
  "reasoning": "Why this action makes sense for the goal",
  "confidence": "high|medium|low",
  "alternatives": ["Alternative selector 1", "Alternative selector 2"],
  "humanNeeded": false,
  "humanReason": "Why human is needed (if applicable)"
}

IMPORTANT: 
- Respond with ONLY valid JSON, no markdown formatting
- If you can't find the expected element, set humanNeeded to true
- Be specific with selectors (use data-testid, unique text, or aria-labels)
- When you see a login page, automatically use the test credentials provided above
- Use proper CSS selectors like 'input[type="email"]', 'input[type="password"]', etc.
- After entering credentials, click the login/sign-in button`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.error('   ⚠️  AI guidance failed:', error.message);
      return null;
    }
  }
  
  async verifyTestResult(pageContext, expectedOutcome) {
    const prompt = `You are verifying test results for CVStomize.

EXPECTED OUTCOME: ${expectedOutcome}

CURRENT PAGE STATE:
- URL: ${pageContext.url}
- Title: ${pageContext.title}
- Visible text: ${pageContext.visibleText.substring(0, 1000)}
- Errors: ${pageContext.errors.join(', ') || 'None'}

TASK: Did the test achieve its expected outcome?

RESPONSE FORMAT (valid JSON only):
{
  "passed": true|false,
  "confidence": "high|medium|low",
  "reasoning": "Explanation of why test passed/failed",
  "evidence": "Specific text or elements that confirm result",
  "suggestions": "What to check or improve"
}

Respond with ONLY valid JSON, no markdown.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('   ⚠️  AI verification failed:', error.message);
    }
    
    return null;
  }
}

/**
 * Autonomous Test Runner
 */
class AutonomousTestRunner {
  constructor(progressManager, aiAssistant, config) {
    this.progress = progressManager;
    this.ai = aiAssistant;
    this.config = config;
    this.browser = null;
    this.page = null;
    this.testContext = {}; // Store data across tests (e.g., user credentials)
  }
  
  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.config.SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(this.config.REPORTS_DIR, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: this.config.HEADLESS,
      slowMo: this.config.SLOW_MO,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  async takeScreenshot(testId, suffix = '') {
    const filename = `${testId}${suffix ? '-' + suffix : ''}-${Date.now()}.png`;
    const filepath = path.join(this.config.SCREENSHOTS_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }
  
  async waitForHumanIntervention(testName, reason) {
    console.log('\n⏸️  ═══════════════════════════════════════════════════════');
    console.log('   HUMAN INTERVENTION REQUIRED');
    console.log('   ═══════════════════════════════════════════════════════');
    console.log(`   Test: ${testName}`);
    console.log(`   Reason: ${reason}`);
    console.log('\n   Please review the browser and provide input:');
    console.log('   - Type "pass" if test passed');
    console.log('   - Type "fail" if test failed');
    console.log('   - Type "skip" to skip this test');
    console.log('   - Add notes after result (e.g., "pass - looks good")');
    console.log('   ═══════════════════════════════════════════════════════\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('   Your input: ', (answer) => {
        rl.close();
        const parts = answer.trim().toLowerCase().split(' - ');
        const result = parts[0];
        const notes = parts.slice(1).join(' - ');
        
        if (result === 'pass') resolve({ result: 'pass', notes });
        else if (result === 'fail') resolve({ result: 'fail', notes });
        else if (result === 'skip') resolve({ result: 'skip', notes });
        else resolve({ result: 'undetermined', notes: answer });
      });
    });
  }
  
  async executeAction(guidance, testId) {
    const { nextAction, target, value, alternatives } = guidance;
    
    try {
      switch (nextAction) {
        case 'navigate':
          console.log(`   🌐 Navigating to: ${target}`);
          await this.page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 });
          await sleep(1000);
          break;
          
        case 'click':
          console.log(`   🖱️  Clicking: ${target}`);
          await this.page.click(target);
          await sleep(1500);
          break;
          
        case 'type':
          console.log(`   ⌨️  Typing in: ${target}`);
          await this.page.type(target, value, { delay: 50 });
          await sleep(500);
          break;
          
        case 'wait':
          const waitTime = parseInt(value) || 2000;
          console.log(`   ⏳ Waiting ${waitTime}ms...`);
          await sleep(waitTime);
          break;
          
        case 'verify':
          console.log(`   ✓ Verifying: ${target}`);
          // Verification handled by AI
          break;
          
        case 'human-needed':
          return { requiresHuman: true, reason: guidance.humanReason };
          
        default:
          console.log(`   ⚠️  Unknown action: ${nextAction}`);
      }
      
      await this.takeScreenshot(testId, nextAction);
      return { success: true };
      
    } catch (error) {
      console.log(`   ❌ Action failed: ${error.message}`);
      
      // Try alternatives
      if (alternatives && alternatives.length > 0) {
        console.log(`   🔄 Trying alternatives...`);
        for (const alt of alternatives) {
          try {
            if (nextAction === 'click') {
              await this.page.click(alt);
              console.log(`   ✓ Success with alternative: ${alt}`);
              return { success: true };
            }
          } catch (altError) {
            continue;
          }
        }
      }
      
      await this.takeScreenshot(testId, 'error');
      return { success: false, error: error.message };
    }
  }
  
  async runTest(category, testId, test) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST: ${test.name}`);
    console.log(`   Category: ${category} | ID: ${testId}`);
    console.log(`${'='.repeat(70)}\n`);
    
    await this.progress.markStarted(category, testId);
    
    // Navigate to the app first (before AI starts analyzing)
    console.log(`   🌐 Initial navigation to: ${CONFIG.APP_URL}`);
    try {
      await this.page.goto(CONFIG.APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
    } catch (navError) {
      console.log(`   ❌ Failed to navigate to ${CONFIG.APP_URL}: ${navError.message}`);
      throw new Error(`Cannot reach application at ${CONFIG.APP_URL}`);
    }
    
    const actions = [];
    let maxSteps = 20; // Prevent infinite loops
    let stepCount = 0;
    
    try {
      while (stepCount < maxSteps) {
        stepCount++;
        
        // Get current page context
        const pageContext = await this.ai.getPageContext(this.page);
        
        // Get AI guidance
        console.log(`   🤖 Step ${stepCount}: Getting AI guidance...`);
        const guidance = await this.ai.getGuidance(
          pageContext,
          test.name,
          actions
        );
        
        if (!guidance) {
          throw new Error('AI guidance failed');
        }
        
        console.log(`   📋 Analysis: ${guidance.analysis}`);
        console.log(`   🎯 Action: ${guidance.nextAction} | ${guidance.target}`);
        console.log(`   💭 Reasoning: ${guidance.reasoning}`);
        console.log(`   🎚️  Confidence: ${guidance.confidence}`);
        
        actions.push(`${guidance.nextAction}:${guidance.target}`);
        
        // Check if human needed
        if (guidance.humanNeeded || test.requiresHuman) {
          const humanResult = await this.waitForHumanIntervention(
            test.name,
            guidance.humanReason || 'Test requires manual verification'
          );
          
          if (humanResult.result === 'skip') {
            await this.progress.updateTest(category, testId, {
              status: 'skipped',
              notes: humanResult.notes
            });
            await this.progress.save();
            return;
          }
          
          await this.progress.markCompleted(category, testId, humanResult.result, humanResult.notes);
          return;
        }
        
        // Execute action
        const result = await this.executeAction(guidance, `${category}-${testId}`);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        if (result.requiresHuman) {
          const humanResult = await this.waitForHumanIntervention(test.name, result.reason);
          await this.progress.markCompleted(category, testId, humanResult.result, humanResult.notes);
          return;
        }
        
        // Check if test complete
        if (guidance.nextAction === 'verify') {
          const verification = await this.ai.verifyTestResult(pageContext, test.name);
          
          if (verification) {
            console.log(`\n   ✅ Verification: ${verification.reasoning}`);
            console.log(`   📊 Confidence: ${verification.confidence}`);
            
            const result = verification.passed ? 'pass' : 'fail';
            await this.progress.markCompleted(category, testId, result, verification.reasoning);
            return;
          }
        }
        
        // Auto-complete after reasonable steps
        if (stepCount >= 15) {
          console.log(`\n   ⚠️  Test reached max steps, requesting verification...`);
          const humanResult = await this.waitForHumanIntervention(
            test.name,
            'Test reached maximum steps'
          );
          await this.progress.markCompleted(category, testId, humanResult.result, humanResult.notes);
          return;
        }
      }
      
    } catch (error) {
      console.error(`\n   ❌ Test failed: ${error.message}`);
      await this.takeScreenshot(`${category}-${testId}`, 'final-error');
      await this.progress.markFailed(category, testId, error.message, false);
    }
  }
  
  async runAll() {
    await this.initialize();
    
    console.log('\n🚀 Starting Autonomous Test Run');
    console.log(`   Configuration: ${this.config.HEADLESS ? 'Headless' : 'Headed'} mode`);
    console.log(`   AI Model: ${this.config.GEMINI_MODEL}\n`);
    
    let testRun = this.progress.getNextPendingTest();
    
    while (testRun) {
      const { category, testId, test } = testRun;
      
      await this.runTest(category, testId, test);
      
      // Get next test
      testRun = this.progress.getNextPendingTest();
      
      if (testRun) {
        console.log('\n   ⏭️  Moving to next test...\n');
        await sleep(2000);
      }
    }
    
    await this.cleanup();
    this.printSummary();
  }
  
  printSummary() {
    const stats = this.progress.getStats();
    
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 TEST RUN SUMMARY');
    console.log('='.repeat(70));
    console.log(`   Total Tests: ${stats.total}`);
    console.log(`   ✅ Passed: ${stats.passed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ❓ Undetermined: ${stats.undetermined}`);
    console.log(`   ⏸️  Needs Human: ${stats.needsHuman}`);
    console.log(`   ⏳ Not Started: ${stats.notStarted}`);
    console.log(`   📈 Pass Rate: ${((stats.passed / (stats.passed + stats.failed)) * 100 || 0).toFixed(1)}%`);
    console.log('='.repeat(70) + '\n');
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Load progress
  const progress = new TestProgressManager(CONFIG.PROGRESS_FILE);
  await progress.load();
  
  // Initialize AI
  const ai = new AITestAssistant(aiModel);
  
  // Initialize runner
  const runner = new AutonomousTestRunner(progress, ai, CONFIG);
  
  // Run tests
  await runner.runAll();
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
