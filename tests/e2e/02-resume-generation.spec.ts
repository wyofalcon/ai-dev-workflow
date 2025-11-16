// Test Suite 2: Resume Generation WITHOUT Existing Resume
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 2

import { test, expect } from '@playwright/test';
import { CVstomizePage, waitForApiResponse } from './helpers';
import testData from '../fixtures/test-data.json';

test.describe('Resume Generation - Without Upload', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    // Assume user is already logged in (use storage state or login fixture)
  });

  test('2.1-2.6: Complete Resume Generation Flow', async ({ page }) => {
    // This is a comprehensive test covering all steps from Section 2
    
    // 2.1: Start Resume Creation
    await cvPage.goto();
    await cvPage.clickCreateResume();
    await expect(page).toHaveURL(/create-resume/);
    console.log('✅ Step 2.1: Started resume creation');
    
    // 2.2: Job Description Input (No Resume Upload)
    const jd = testData.jobDescriptions.marketingManager.description;
    await cvPage.pasteJobDescription(jd);
    
    // Click analyze/next
    const analyzeResponse = waitForApiResponse(page, '/api/conversation/start');
    await cvPage.clickAnalyzeOrNext();
    await analyzeResponse;
    console.log('✅ Step 2.2: Job description analyzed');
    
    // 2.3: AI Question Generation
    await cvPage.waitForQuestionsToGenerate();
    
    // Count questions (should be 2-5, NOT 11)
    const questionCount = await page.locator('textarea, input[type="text"]').filter({
      has: page.locator(':visible')
    }).count();
    
    expect(questionCount).toBeGreaterThanOrEqual(2);
    expect(questionCount).toBeLessThanOrEqual(5);
    
    // Verify no "11 questions" text
    await cvPage.expectNo11Questions();
    console.log(`✅ Step 2.3: ${questionCount} questions generated (correct range)`);
    
    // 2.4: Answer Questions
    const answers = Object.values(testData.sampleAnswers.marketing).slice(0, questionCount);
    await cvPage.answerQuestions(answers);
    console.log('✅ Step 2.4: Answered all questions');
    
    // 2.5: Generate Resume
    const generateResponse = waitForApiResponse(page, '/api/resume/generate', 60000);
    await cvPage.clickGenerateResume();
    await generateResponse;
    console.log('✅ Step 2.5: Resume generation started');
    
    // 2.6: Resume Preview & Content Verification
    await cvPage.waitForResumeGeneration();
    
    // CRITICAL CHECKS
    await cvPage.expectNoPlaceholders();
    
    // Check for real user name (not Alex Johnson or John Doe)
    const content = await page.textContent('body');
    expect(content).toContain(testData.profileData.default.fullName);
    
    // Verify resume content includes user's answers
    expect(content).toContain('6 years'); // From marketing experience answer
    expect(content).toContain('Google Analytics'); // From tools mentioned
    expect(content).toContain('5,000'); // From campaign metrics
    
    console.log('✅ Step 2.6: Resume content verified - all checks passed');
    
    // Take screenshot for review
    await page.screenshot({ path: 'tests/reports/screenshots/resume-generated.png', fullPage: true });
  });
});
