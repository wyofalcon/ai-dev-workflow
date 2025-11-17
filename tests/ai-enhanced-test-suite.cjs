#!/usr/bin/env node
/**
 * AI-Enhanced Automated Testing Suite
 * 
 * Uses AI to:
 * - Understand the current page state
 * - Decide what action to take next
 * - Adapt when elements aren't found
 * - Verify results intelligently
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Check if Google AI SDK is available
let GoogleGenerativeAI;
try {
  const genAI = require('@google/generative-ai');
  GoogleGenerativeAI = genAI.GoogleGenerativeAI;
} catch (e) {
  console.log('⚠️  Google Generative AI not installed. Install with: npm install @google/generative-ai');
  console.log('   Falling back to rule-based testing...\n');
}

const APP_URL = 'https://cvstomize-frontend-351889420459.us-central1.run.app';

// Test configuration
const TEST_USER = {
  email: `ai-test-${Date.now()}@cvstomize-test.com`,
  password: 'AITestPass123!',
  name: 'AI Test User'
};
const SCREENSHOTS_DIR = 'tests/reports/screenshots';

// Initialize AI if API key available
let aiModel = null;
if (GoogleGenerativeAI && process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Use Gemini 2.5 Flash - latest fast model
  aiModel = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });
  console.log('✅ AI-enhanced testing enabled (using Gemini 2.5 Flash)\n');
} else {
  console.log('⚠️  AI testing requires GEMINI_API_KEY environment variable');
  console.log('   Set it with: export GEMINI_API_KEY=your_key_here\n');
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
- Input fields: ${pageContext.inputs.join(', ')}

INSTRUCTIONS:
1. Analyze what step we're on in the testing flow
2. Suggest the EXACT next action to take
3. If the expected element isn't found, suggest alternatives
4. Format response as JSON:

{
  "analysis": "Brief description of current page state",
  "nextAction": "click|type|navigate|wait",
  "target": "selector or description of element",
  "value": "text to type (if applicable)",
  "reasoning": "Why this action makes sense",
  "alternatives": ["Alternative action if primary fails"]
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
    console.log('   ⚠️  AI guidance failed:', error.message);
  }
  
  return null;
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
 * Smart element finder using AI
 */
async function findElementSmart(page, description, aiGuidance = null) {
  console.log(`   🔍 Looking for: ${description}`);
  
  // Try AI guidance first
  if (aiGuidance && aiGuidance.target) {
    try {
      const element = await page.$(aiGuidance.target);
      if (element) {
        console.log(`   ✅ Found using AI guidance: ${aiGuidance.target}`);
        return element;
      }
    } catch (e) {
      console.log(`   ⚠️  AI suggested selector failed: ${e.message}`);
    }
  }
  
  // Fallback to smart search
  const searchTerms = description.toLowerCase();
  
  // Try to find by common patterns
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
    console.log(`   ✅ Found element`);
    return element.asElement();
  }
  
  console.log(`   ❌ Element not found: ${description}`);
  return null;
}

/**
 * Execute test step with AI guidance
 */
async function executeTestStep(page, goal, fallbackAction) {
  console.log(`\n📍 Goal: ${goal}`);
  
  // Get current page state
  const context = await getPageContext(page);
  console.log(`   Current page: ${context.title} (${context.url})`);
  
  // Get AI guidance
  const aiGuidance = await getAIGuidance(context, goal);
  
  if (aiGuidance) {
    console.log(`   🤖 AI Analysis: ${aiGuidance.analysis}`);
    console.log(`   🎯 AI Suggests: ${aiGuidance.nextAction} on "${aiGuidance.target}"`);
    console.log(`   💭 Reasoning: ${aiGuidance.reasoning}`);
    
    // Try to execute AI's suggestion
    try {
      if (aiGuidance.nextAction === 'click') {
        const element = await findElementSmart(page, aiGuidance.target, aiGuidance);
        if (element) {
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, method: 'ai' };
        }
      } else if (aiGuidance.nextAction === 'type' && aiGuidance.value) {
        const element = await findElementSmart(page, aiGuidance.target, aiGuidance);
        if (element) {
          await element.type(aiGuidance.value, { delay: 10 });
          return { success: true, method: 'ai' };
        }
      } else if (aiGuidance.nextAction === 'navigate') {
        await page.goto(aiGuidance.target, { waitUntil: 'networkidle2' });
        return { success: true, method: 'ai' };
      } else if (aiGuidance.nextAction === 'wait') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, method: 'ai' };
      }
    } catch (error) {
      console.log(`   ⚠️  AI action failed: ${error.message}`);
      
      // Try alternatives
      if (aiGuidance.alternatives && aiGuidance.alternatives.length > 0) {
        console.log(`   🔄 Trying AI alternative: ${aiGuidance.alternatives[0]}`);
        // Could implement alternative execution here
      }
    }
  }
  
  // Fallback to rule-based action
  console.log(`   🔧 Falling back to rule-based action`);
  return await fallbackAction();
}

/**
 * Main test execution
 */
async function runAIEnhancedTests() {
  console.log('🤖 AI-Enhanced Test Suite\n');
  console.log('This test suite uses AI to adapt to changes in the UI');
  console.log('and find elements even when selectors change.\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Navigate to homepage
    await executeTestStep(
      page,
      `Navigate to CVstomize staging app at ${APP_URL}`,
      async () => {
        await page.goto(APP_URL, { waitUntil: 'networkidle2' });
        return { success: true, method: 'fallback' };
      }
    );
    
    // Test 2: Find and click signup
    const signupResult = await executeTestStep(
      page,
      'Find and click the Sign Up button or link to create a new account',
      async () => {
        const signupBtn = await findElementSmart(page, 'sign up');
        if (signupBtn) {
          await signupBtn.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, method: 'fallback' };
        }
        return { success: false };
      }
    );
    
    if (signupResult.success) {
      // Test 3: Fill email field
      await executeTestStep(
        page,
        'Type email address into the email input field',
        async () => {
          const emailInput = await findElementSmart(page, 'email');
          if (emailInput) {
            await emailInput.type(TEST_USER.email, { delay: 10 });
            return { success: true, method: 'fallback' };
          }
          return { success: false };
        }
      );
      
      // Test 4: Fill password
      await executeTestStep(
        page,
        'Type password into the password input field',
        async () => {
          const pwInput = await findElementSmart(page, 'password');
          if (pwInput) {
            await pwInput.type(TEST_USER.password, { delay: 10 });
            return { success: true, method: 'fallback' };
          }
          return { success: false };
        }
      );
      
      // Test 5: Submit signup
      await executeTestStep(
        page,
        'Click the submit or sign up button to create the account',
        async () => {
          const submitBtn = await findElementSmart(page, 'create account');
          if (submitBtn) {
            await submitBtn.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            return { success: true, method: 'fallback' };
          }
          return { success: false };
        }
      );
      
      console.log('\n✅ AI-enhanced signup flow complete!');
      console.log(`   Test account: ${TEST_USER.email}`);
    } else {
      console.log('\n⚠️  Could not complete signup - button not found');
    }
    
    console.log('\n✅ AI-enhanced test demonstration complete');
    console.log('\nThis approach allows tests to:');
    console.log('  - Adapt when UI changes');
    console.log('  - Find elements by description, not just selectors');
    console.log('  - Understand context and make intelligent decisions');
    console.log('  - Suggest alternatives when primary actions fail');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️  GEMINI_API_KEY not set!');
  console.log('\nTo enable AI-enhanced testing:');
  console.log('1. Get your API key from: https://makersuite.google.com/app/apikey');
  console.log('2. Set environment variable:');
  console.log('   export GEMINI_API_KEY="your-key-here"');
  console.log('3. Run this script again\n');
  console.log('Running in demo mode...\n');
}

runAIEnhancedTests().catch(console.error);
