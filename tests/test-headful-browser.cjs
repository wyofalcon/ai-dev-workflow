/**
 * CVstomize Headful Browser Testing Script
 * Based on TESTING_GUIDE_SESSION_28.md
 * Runs in visible browser window for manual observation
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://cvstomize-frontend-351889420459.us-central1.run.app';
const TEST_EMAIL = 'fco.calisto@gmail.com';

const JOB_DESCRIPTION = `Software Engineer - Full Stack

We're looking for a talented Full Stack Software Engineer to join our growing team.

Responsibilities:
- Build and maintain web applications using React and Node.js
- Design and implement RESTful APIs
- Work with PostgreSQL databases
- Collaborate with product and design teams
- Write clean, maintainable code

Requirements:
- 3+ years of experience in web development
- Strong knowledge of JavaScript, React, and Node.js
- Experience with SQL databases
- Understanding of RESTful API design
- Bachelor's degree in Computer Science or equivalent`;

const SAMPLE_ANSWERS = [
  "I've been building web applications for about 4 years. I started with basic HTML/CSS and JavaScript, then learned React and Node.js. I've built several full-stack projects including an e-commerce site and a task management app. I really enjoy creating intuitive user interfaces and solving complex problems with clean code.",
  "I've worked extensively with PostgreSQL in my personal projects. I designed database schemas for a multi-tenant SaaS application, wrote complex queries with joins and aggregations, and implemented database migrations. I also have some experience with MongoDB for projects that needed flexible schemas.",
  "I once had to optimize a slow API endpoint that was timing out. I used database query analysis to find N+1 query issues, implemented caching with Redis, and added database indexes. The endpoint went from 8 seconds to under 200ms. It taught me a lot about performance optimization.",
  "In my last bootcamp project, I led a team of 3 developers building a social media app. I set up the project structure, handled code reviews, and made sure we followed best practices. We used Git for version control and had daily standups. The project was a success and got featured by the bootcamp.",
  "I love the feeling of solving problems and seeing users actually use what I built. I'm motivated by learning new technologies and improving my craft. I enjoy collaborating with others and learning from more experienced developers. The challenge of turning ideas into working software is what drives me."
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCVstomize() {
  console.log('🚀 Starting CVstomize Headful Browser Test...\n');
  
  // Launch browser in headful mode using system Chromium
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/chromium-browser',
    defaultViewport: { width: 1400, height: 900 },
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security', // Allow clipboard access
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
    slowMo: 250 // Reduced from 500ms for more natural speed
  });

  const page = await browser.newPage();
  
  // Grant clipboard permissions for pasting
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(TEST_URL, ['clipboard-read', 'clipboard-write']);

  
  // Emulate human-like behavior
  await page.evaluateOnNewDocument(() => {
    // Hide automation indicators
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // Add realistic properties
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });
  
  try {
    console.log('📍 Step 1: Navigate to CVstomize');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
    console.log('✅ Loaded:', TEST_URL);
    await sleep(2000);

    console.log('\n📍 Step 2: Click "CREATE YOUR AI RESUME" button');
    // Wait for the button and click it
    try {
      await page.waitForSelector('button', { timeout: 5000 });
      const buttons = await page.$$('button');
      let buttonClicked = false;
      
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent?.trim(), button);
        if (text && text.includes('CREATE YOUR AI RESUME')) {
          console.log(`✅ Found button: "${text}"`);
          await button.click();
          buttonClicked = true;
          console.log('✅ Clicked "CREATE YOUR AI RESUME" button');
          await sleep(3000);
          break;
        }
      }
      
      if (!buttonClicked) {
        console.log('❌ Button not found automatically.');
        console.log('🖱️  Please click "CREATE YOUR AI RESUME" button manually in the browser...');
        console.log('   Waiting 15 seconds...');
        await sleep(15000);
      }
    } catch (e) {
      console.log('❌ Error clicking button:', e.message);
      console.log('🖱️  Please click manually in the browser...');
      await sleep(10000);
    }

    console.log('\n📍 Step 3: Check if login required');
    await sleep(2000); // Wait for page to settle
    
    try {
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('auth') || currentUrl.includes('login') || currentUrl.includes('firebase') || currentUrl.includes('google')) {
        console.log('🔐 Login required - Please login manually in the browser');
        console.log(`   Use email: ${TEST_EMAIL}`);
        console.log('   Waiting 90 seconds for login...');
        await sleep(90000);
        console.log('   Continuing after login wait...');
      } else {
        console.log('   ✅ No login required (or already logged in)');
      }
    } catch (e) {
      console.log(`   ⚠️  Could not check URL: ${e.message}`);
      console.log('   Waiting 10 seconds for page to stabilize...');
      await sleep(10000);
    }

    console.log('\n📍 Step 4: Paste Job Description');
    // Find textarea for job description
    await page.waitForSelector('textarea', { timeout: 10000 });
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      console.log(`Found ${textareas.length} textarea(s)`);
      // Human behavior: Click to focus, then paste (Ctrl+V)
      await textareas[0].click();
      await sleep(500); // Small pause after clicking
      
      // Use clipboard paste like a real user would
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, JOB_DESCRIPTION);
      await sleep(200);
      
      // Paste with Ctrl+V
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyV');
      await page.keyboard.up('Control');
      
      console.log('✅ Job description pasted (using Ctrl+V)');
      await sleep(1500);
    }

    console.log('\n📍 Step 5: Click Next/Continue to get questions');
    // Look for Next/Continue/Submit button
    const nextButtons = await page.$$('button');
    for (const button of nextButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Continue') || text.includes('Submit')) {
        console.log(`Clicking: "${text}"`);
        await button.click();
        break;
      }
    }
    await sleep(5000);

    console.log('\n📍 Step 6: Answer Questions');
    console.log('⏳ Waiting for questions to be generated by AI...');
    await sleep(10000); // Wait for Gemini to generate questions

    // Answer each question
    let questionIndex = 0;
    while (questionIndex < SAMPLE_ANSWERS.length) {
      console.log(`\n   Question ${questionIndex + 1}:`);
      
      const answer = SAMPLE_ANSWERS[questionIndex];
      console.log(`   Pasting answer (${answer.length} chars)...`);
      
      try {
        // Wait for textarea to be present and interactable
        await page.waitForSelector('textarea', { visible: true, timeout: 5000 });
        await sleep(500);
        
        // Click the last visible textarea (current question)
        await page.evaluate(() => {
          const textareas = Array.from(document.querySelectorAll('textarea'));
          const lastTextarea = textareas[textareas.length - 1];
          if (lastTextarea) {
            lastTextarea.focus();
            lastTextarea.click();
          }
        });
        await sleep(400);
        
        // Paste using keyboard shortcut
        await page.evaluate((text) => {
          navigator.clipboard.writeText(text);
        }, answer);
        await sleep(200);
        
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyV');
        await page.keyboard.up('Control');
        
        console.log('   ✅ Answer pasted');
        await sleep(1000);
      } catch (e) {
        console.log(`   ⚠️  Error pasting answer: ${e.message}`);
        console.log('   Trying to continue...');
      }

      // Human behavior: Small pause before clicking Next
      await sleep(600);
      
      // Click Next/Continue
      const buttons = await page.$$('button');
      let foundNext = false;
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Next') || text.includes('Continue') || text.includes('Generate')) {
          console.log(`   Clicking: "${text}"`);
          
          // Human behavior: Move mouse to button before clicking
          const box = await button.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
            await sleep(100);
          }
          await button.click();
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        console.log('   ⚠️  No Next button found - might be last question');
        break;
      }

      questionIndex++;
      await sleep(3000); // Reduced wait time between questions
    }

    console.log('\n📍 Step 7: Generate Resume');
    console.log('🔍 Looking for "Generate Resume" button...');
    await sleep(2000);
    
    const generateButtons = await page.$$('button');
    for (const button of generateButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Generate')) {
        console.log(`✅ Found: "${text}"`);
        await button.click();
        console.log('⏳ Generating resume (this may take 20-40 seconds)...');
        break;
      }
    }

    // Wait for resume generation
    await sleep(40000);

    console.log('\n📍 Step 8: Verify Results');
    console.log('🔍 Checking resume content...');
    
    const bodyText = await page.evaluate(() => document.body.textContent);
    
    const checks = {
      'Contains "React"': bodyText.includes('React'),
      'Contains "Node.js"': bodyText.includes('Node.js') || bodyText.includes('Node'),
      'Contains "PostgreSQL"': bodyText.includes('PostgreSQL') || bodyText.includes('SQL'),
      'NOT "Alex Johnson"': !bodyText.includes('Alex Johnson'),
      'NOT "[Your Company]"': !bodyText.includes('[Your Company]'),
      'Contains email': bodyText.includes('@')
    };

    console.log('\n📊 Test Results:');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    }

    console.log('\n🎉 Test complete! Browser will remain open for manual inspection.');
    console.log('   Check the resume for:');
    console.log('   - Real Google name (not "Alex Johnson")');
    console.log('   - Your actual answers in the content');
    console.log('   - Professional formatting');
    console.log('   - Download buttons work');
    console.log('\nPress Ctrl+C to close the browser...');

    // Keep browser open
    await sleep(300000); // 5 minutes

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: '/home/wyofalcon/cvstomize/test-error.png', fullPage: true });
    console.log('   Screenshot saved to: test-error.png');
    throw error;
  } finally {
    // Don't close immediately - let user inspect
    console.log('\nBrowser will stay open. Press Ctrl+C to exit.');
  }
}

// Run the test
testCVstomize().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
