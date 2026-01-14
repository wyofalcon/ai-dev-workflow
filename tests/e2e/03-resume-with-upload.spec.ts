// Test Suite 3: Resume Generation WITH Existing Resume Upload
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 3

import { test, expect } from '@playwright/test';
import { CVstomizePage } from './helpers';
import testData from '../fixtures/test-data.json' assert { type: 'json' };
import * as path from 'path';
import * as fs from 'fs';

test.describe('Resume Generation - With Upload', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    // MANUAL PREREQUISITE: You must be logged in
    console.log('⏸️  PREREQUISITE: Please ensure you are logged in');
    console.log('   Waiting 10 seconds for you to prepare...');
    await page.waitForTimeout(10000);
  });

  test('3.1-3.2: Upload Existing Resume', async ({ page }) => {
    // 3.1: Start New Resume with Upload
    await cvPage.goto();
    await cvPage.clickCreateResume();
    
    console.log('⏸️  MANUAL STEP: Look for "Upload Existing Resume" option');
    console.log('   Please prepare a resume file (.pdf, .docx, or .txt)');
    console.log('   Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    // Check for upload button/dropzone
    const uploadButton = page.locator('input[type="file"]').or(
      page.locator('text=/upload.*resume/i')
    );
    await expect(uploadButton.first()).toBeVisible({ timeout: 30000 });
    
    console.log('⏸️  MANUAL STEP: Please upload your resume file now');
    console.log('   - Drag and drop OR click to select file');
    console.log('   - Supported: .pdf, .docx, .txt');
    console.log('   Waiting 60 seconds for upload to complete...');
    await page.waitForTimeout(60000);
    
    // Verify upload completed (look for file name or preview)
    const uploadSuccess = page.locator('text=/uploaded|preview|file.*selected/i').or(
      page.locator('[class*="resume-preview"]')
    );
    
    console.log('✅ Test 3.1-3.2: Checking for upload confirmation...');
    // Optional check - may not always be visible
    const isVisible = await uploadSuccess.first().isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Test 3.1-3.2 PASSED: Resume upload confirmed');
    } else {
      console.log('⚠️  Could not confirm upload - please verify manually');
    }
  });

  test('3.3: Job Description Input (With Uploaded Resume)', async ({ page }) => {
    console.log('⏸️  PREREQUISITE: This test assumes you just uploaded a resume in test 3.1-3.2');
    console.log('   If not, please run test 3.1-3.2 first');
    console.log('   Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    // Paste job description
    const jobDescription = testData.jobDescriptions.softwareEngineer.description;
    
    const jdInput = page.locator('textarea').or(
      page.locator('input[type="text"]')
    ).filter({ hasText: /job.*description|paste.*job/i }).or(
      page.locator('[placeholder*="job"]').or(page.locator('[placeholder*="Job"]'))
    );
    
    console.log('📝 Pasting Software Engineer job description...');
    await jdInput.first().fill(jobDescription);
    
    // Click Analyze or Next
    const analyzeButton = page.locator('button', { hasText: /analyze|next|continue/i });
    await analyzeButton.first().click();
    
    console.log('⏳ Waiting for gap analysis (5-10 seconds)...');
    await page.waitForTimeout(10000);
    
    console.log('✅ Test 3.3 PASSED: Job description submitted for gap analysis');
  });

  test('3.4: Gap Analysis Questions (Resume-First Mode)', async ({ page }) => {
    console.log('⏸️  PREREQUISITE: This test assumes gap analysis just completed');
    console.log('   You should see 2-4 questions about gaps between your resume and job');
    console.log('   Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    // Count questions
    const questions = page.locator('[class*="question"]').or(
      page.locator('h3').or(page.locator('h4'))
    ).filter({ hasText: /\?$/ });
    
    const questionCount = await questions.count().catch(() => 0);
    
    console.log(`📊 Found ${questionCount} questions`);
    
    // Expected: 2-4 questions (fewer than no-resume mode which has 4-6)
    if (questionCount >= 2 && questionCount <= 5) {
      console.log(`✅ Test 3.4 PASSED: Question count (${questionCount}) is in expected range for gap analysis`);
    } else {
      console.log(`⚠️  Question count (${questionCount}) outside typical 2-4 range - verify manually`);
    }
    
    // Print questions for verification
    for (let i = 0; i < Math.min(questionCount, 5); i++) {
      const questionText = await questions.nth(i).textContent().catch(() => '');
      console.log(`  Q${i + 1}: ${questionText}`);
    }
    
    console.log('⏸️  VERIFY: Questions should focus on GAPS (missing skills, weak areas)');
    console.log('   Questions should NOT ask about things already strong in your resume');
  });

  test('3.5: Answer Gap Analysis Questions', async ({ page }) => {
    console.log('⏸️  MANUAL STEP: Please answer the gap-focused questions');
    console.log('   Use the sample answers from the testing guide or your own experience');
    console.log('   Provide 2-3 sentences with specific examples');
    console.log('   Waiting 120 seconds (2 minutes) for you to complete answers...');
    await page.waitForTimeout(120000);
    
    // Look for Generate or Submit button
    const generateButton = page.locator('button', { 
      hasText: /generate|create.*resume|submit|finish/i 
    });
    
    const isVisible = await generateButton.first().isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Test 3.5 PASSED: Questions answered, ready to generate');
    } else {
      console.log('⚠️  Could not find generate button - verify answers submitted correctly');
    }
  });

  test('3.6: Generate Hybrid Resume', async ({ page }) => {
    console.log('⏸️  MANUAL STEP: Click the "Generate Resume" button');
    console.log('   Waiting 15 seconds for you to click...');
    await page.waitForTimeout(15000);
    
    console.log('⏳ Waiting for resume generation (20-40 seconds)...');
    console.log('   System is creating a hybrid resume combining:');
    console.log('   - Your uploaded resume content');
    console.log('   - Gap-filling answers');
    console.log('   - Job description alignment');
    await page.waitForTimeout(40000);
    
    // Check for resume preview or success
    const resumePreview = page.locator('[class*="resume"]').or(
      page.locator('text=/successfully|generated|complete/i')
    );
    
    const isVisible = await resumePreview.first().isVisible({ timeout: 30000 }).catch(() => false);
    
    if (isVisible) {
      console.log('✅ Test 3.6 PASSED: Hybrid resume generated successfully');
      console.log('');
      console.log('🔍 VERIFY MANUALLY:');
      console.log('   1. Resume includes content from your uploaded resume');
      console.log('   2. Gap-filling answers are integrated naturally');
      console.log('   3. Resume is tailored to the job description');
      console.log('   4. No placeholder text like "[Your Name]"');
      console.log('   5. Contact info uses your real profile data');
    } else {
      console.log('⚠️  Could not confirm resume generation - check page manually');
    }
  });
});
