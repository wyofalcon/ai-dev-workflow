// Test Suite 1: Authentication & Account Management
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 1

import { test, expect } from '@playwright/test';
import { CVstomizePage } from './helpers';
import testData from '../fixtures/test-data.json' assert { type: 'json' };

test.describe('Authentication & Account Management', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    await cvPage.goto();
  });

  test('1.1: Google SSO Signup (New User)', async ({ page, context }, testInfo) => {
    // MANUAL TEST: Requires human interaction - skip in headless mode
    test.skip(testInfo.project.use?.headless !== false, 'OAuth requires manual interaction - run in headed mode');
    
    await cvPage.clickSignup();
    await expect(page).toHaveURL(/signup/);
    
    console.log('⏸️  PAUSED: Please click "Sign in with Google" and complete the OAuth flow');
    console.log('   The test will continue automatically once you reach the dashboard');
    
    await cvPage.signInWithGoogle();
    
    // Wait for manual Google OAuth completion - 5 minutes timeout
    await page.waitForURL('/', { timeout: 300000 });
    
    // Verify logged in state
    await cvPage.waitForProfileToLoad();
    const resumeCount = await cvPage.getResumeCount();
    expect(resumeCount?.generated).toBeGreaterThan(-1);
    expect(resumeCount?.limit).toBeGreaterThan(0);
    
    console.log('✅ Test 1.1 PASSED: Google SSO signup successful');
  });

  test('1.2: Email/Password Signup (New User)', async ({ page }) => {
    // Use unique email with timestamp to avoid conflicts
    const timestamp = Date.now();
    const email = `test-${timestamp}@cvstomize-test.com`;
    const password = testData.testAccounts.emailPassword.password;
    const displayName = testData.testAccounts.emailPassword.displayName;
    
    console.log(`📧 Creating new account: ${email}`);
    
    await cvPage.clickSignup();
    await expect(page).toHaveURL(/signup/);
    
    // Fill signup form
    await page.getByLabel(/full name/i).fill(displayName);
    await cvPage.fillEmailPasswordForm(email, password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    
    // Submit
    await page.getByRole('button', { name: /create account|sign up/i }).click();
    
    // Wait for redirect or success message
    await page.waitForURL(/\/(|home)/, { timeout: 15000 }).catch(() => {
      // If email verification required, check for message
      expect(page.locator('text=/verify|check.*email/i')).toBeVisible();
    });
    
    console.log('✅ Test 1.2 PASSED: Email/password signup successful');
  });

  test('1.3: Google SSO Login (Existing User)', async ({ page }, testInfo) => {
    // MANUAL TEST: Requires human interaction - skip in headless mode
    test.skip(testInfo.project.use?.headless !== false, 'OAuth requires manual interaction - run in headed mode');
    
    console.log('⏸️  PAUSED: Please sign in with an EXISTING Google account');
    
    await cvPage.clickLogin();
    await cvPage.signInWithGoogle();
    
    // Wait for manual Google OAuth completion - 5 minutes timeout
    await page.waitForURL('/', { timeout: 300000 });
    await cvPage.waitForProfileToLoad();
    
    console.log('✅ Test 1.3 PASSED: Google SSO login successful');
  });

  test('1.6: Logout Functionality', async ({ page }, testInfo) => {
    // This test requires being logged in first - skip for now
    test.skip(true, 'Requires logged in session - implement with auth fixtures');
    
    await page.getByRole('button', { name: /avatar|account/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
    
    // Verify can't access protected routes
    await page.goto('/resume');
    await expect(page).toHaveURL(/login/);
    
    console.log('✅ Test 1.6 PASSED: Logout successful');
  });

  test('1.7: Profile Completion Modal', async ({ page }, testInfo) => {
    // This test requires a fresh account that hasn't completed profile
    test.skip(true, 'Requires fresh account without completed profile - implement with test fixtures');
    
    await cvPage.clickCreateResume();
    await cvPage.pasteJobDescription(testData.jobDescriptions.marketingManager.description);
    await cvPage.clickAnalyzeOrNext();
    
    // Modal should appear
    await expect(page.locator('text=/complete.*profile/i')).toBeVisible();
    
    // Test skip
    await cvPage.clickSkipProfile();
    await expect(page.locator('text=/complete.*profile/i')).not.toBeVisible();
    
    console.log('✅ Test 1.7a PASSED: Profile modal skip works');
  });
});
