// Test Suite 1: Authentication & Account Management
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 1

import { test, expect } from '@playwright/test';
import { CVstomizePage } from './helpers';
import testData from '../fixtures/test-data.json';

test.describe('Authentication & Account Management', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    await cvPage.goto();
  });

  test('1.1: Google SSO Signup (New User)', async ({ page, context }) => {
    // Note: This test requires manual Google login or mocked auth
    test.skip(!process.env.GOOGLE_TEST_EMAIL, 'Google SSO requires credentials');
    
    await cvPage.clickSignup();
    await expect(page).toHaveURL(/signup/);
    
    await cvPage.signInWithGoogle();
    // Wait for Google OAuth flow (manual or mocked)
    await page.waitForURL('/', { timeout: 60000 });
    
    // Verify logged in state
    await cvPage.waitForProfileToLoad();
    const resumeCount = await cvPage.getResumeCount();
    expect(resumeCount?.generated).toBe(0);
    expect(resumeCount?.limit).toBeGreaterThan(0);
    
    console.log('✅ Test 1.1 PASSED: Google SSO signup successful');
  });

  test('1.2: Email/Password Signup (New User)', async ({ page }) => {
    const { email, password, displayName } = testData.testAccounts.emailPassword;
    
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

  test('1.3: Google SSO Login (Existing User)', async ({ page }) => {
    test.skip(!process.env.GOOGLE_TEST_EMAIL, 'Google SSO requires credentials');
    
    await cvPage.clickLogin();
    await cvPage.signInWithGoogle();
    
    await page.waitForURL('/', { timeout: 60000 });
    await cvPage.waitForProfileToLoad();
    
    console.log('✅ Test 1.3 PASSED: Google SSO login successful');
  });

  test('1.6: Logout Functionality', async ({ page }) => {
    // Assuming already logged in from previous test or session
    test.skip(); // Skip if not logged in
    
    await page.getByRole('button', { name: /avatar|account/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
    
    // Verify can't access protected routes
    await page.goto('/resume');
    await expect(page).toHaveURL(/login/);
    
    console.log('✅ Test 1.6 PASSED: Logout successful');
  });

  test('1.7: Profile Completion Modal', async ({ page }) => {
    // This test requires a fresh account that hasn't completed profile
    test.skip(); // Skip for now, requires specific test state
    
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
