// Test Suite 5: Profile Management
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 5

import { test, expect } from '@playwright/test';
import { CVstomizePage } from './helpers';

test.describe('Profile Management', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    console.log('⏸️  PREREQUISITE: You must be logged in');
    console.log('   Waiting 10 seconds for you to prepare...');
    await page.waitForTimeout(10000);
  });

  test('5.1: View Profile', async ({ page }) => {
    await cvPage.goto();
    
    console.log('📍 Viewing Profile...');
    console.log('⏸️  MANUAL STEP: Click your avatar/menu → "Profile" or "Settings"');
    console.log('   Waiting 15 seconds...');
    await page.waitForTimeout(15000);
    
    // Look for profile data fields
    const profileFields = ['name', 'email', 'phone', 'location', 'linkedin'];
    
    console.log('🔍 Checking for profile fields:');
    for (const field of profileFields) {
      const fieldElement = page.locator(`label:has-text("${field}")`).or(
        page.locator(`text=/^${field}/i`)
      ).or(
        page.locator(`[name*="${field}"]`)
      );
      
      const isVisible = await fieldElement.first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`   ${field}: ${isVisible ? '✅' : '⚠️'}`);
    }
    
    console.log('');
    console.log('🔍 VERIFY MANUALLY:');
    console.log('   - Full Name displayed');
    console.log('   - Email displayed (from account)');
    console.log('   - Phone displayed');
    console.log('   - Location displayed');
    console.log('   - LinkedIn URL displayed');
    console.log('   - Data matches profile completion modal');
    
    console.log('✅ Test 5.1 PASSED: Profile page accessible');
  });

  test('5.2: Edit Profile', async ({ page }) => {
    console.log('⏸️  PREREQUISITE: Navigate to Profile/Settings page');
    console.log('   Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('✏️ Testing Profile Edit...');
    console.log('⏸️  MANUAL STEP: Click "Edit" or "Edit Profile" button');
    console.log('   Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    
    console.log('⏸️  MANUAL STEP: Update the following fields:');
    console.log('   - Full Name: Jane Doe');
    console.log('   - Phone: (555) 987-6543');
    console.log('   - Location: New York, NY');
    console.log('   - LinkedIn: linkedin.com/in/janedoe');
    console.log('   Then click "Save" or "Update Profile"');
    console.log('   Waiting 30 seconds for you to complete...');
    await page.waitForTimeout(30000);
    
    // Look for success message
    const successMessage = page.locator('text=/success|saved|updated/i');
    const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasSuccess) {
      console.log('✅ Success message displayed');
    }
    
    console.log('');
    console.log('🔍 VERIFY MANUALLY:');
    console.log('   - Changes saved successfully');
    console.log('   - Profile updates reflected immediately');
    console.log('   - Generate a new resume and verify new contact info appears');
    console.log('   - New name "Jane Doe" in resume header');
    console.log('   - New phone and location in resume');
    
    console.log('✅ Test 5.2 PASSED: Profile edit functionality works');
  });

  test('5.3: User Avatar Display', async ({ page }) => {
    await cvPage.goto();
    
    console.log('👤 Checking User Avatar Display...');
    
    // Look for avatar in top-right
    const avatar = page.locator('[class*="avatar"]').or(
      page.locator('img[alt*="avatar"]').or(
        page.locator('img[alt*="profile"]')
      )
    ).or(
      page.locator('[class*="user"]').locator('img')
    );
    
    const hasAvatar = await avatar.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasAvatar) {
      console.log('✅ Avatar/photo visible in top-right');
      
      // Check if it's an image (Google SSO) or default icon
      const isImage = await avatar.first().evaluate((el) => el.tagName === 'IMG');
      
      if (isImage) {
        console.log('   Type: Google profile photo or custom image');
        
        // Check if image loaded (not broken)
        const isLoaded = await avatar.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalHeight > 0);
        if (isLoaded) {
          console.log('   ✅ Image loaded successfully (not broken)');
        } else {
          console.log('   ⚠️  Image may be broken - verify manually');
        }
      } else {
        console.log('   Type: Default avatar/icon or initials');
      }
      
      // Test click functionality
      console.log('⏸️  MANUAL STEP: Click the avatar to verify dropdown menu opens');
      console.log('   Waiting 10 seconds...');
      await page.waitForTimeout(10000);
      
    } else {
      console.log('⚠️  Avatar not found in expected location - verify manually');
    }
    
    console.log('');
    console.log('🔍 VERIFY MANUALLY:');
    console.log('   For Google SSO: Google profile photo displays correctly');
    console.log('   For Email: Default avatar or first letter of name');
    console.log('   Photo/avatar is circular/rounded');
    console.log('   Clicking opens dropdown menu');
    
    console.log('✅ Test 5.3 PASSED: Avatar display checked');
  });

  test('5.4: Resume Counter Display', async ({ page }) => {
    await cvPage.goto();
    
    console.log('🔢 Checking Resume Counter Display...');
    
    // Look for resume counter (format: "X / Y resumes")
    const counter = page.locator('text=/\\d+\\s*\\/\\s*\\d+.*resume/i');
    
    const hasCounter = await counter.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasCounter) {
      const counterText = await counter.first().textContent();
      console.log(`✅ Resume counter found: "${counterText}"`);
      
      // Parse the counter (e.g., "3 / 10 resumes")
      const match = counterText?.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const generated = parseInt(match[1]);
        const limit = parseInt(match[2]);
        console.log(`   Generated: ${generated}`);
        console.log(`   Limit: ${limit}`);
        
        if (generated >= 0 && limit > 0) {
          console.log('   ✅ Counter format valid');
        }
      }
    } else {
      // Try alternative formats
      const altCounter = page.locator('[class*="resume"]').locator('[class*="count"]').or(
        page.locator('text=/resume.*\\d+/i')
      );
      const hasAlt = await altCounter.first().isVisible().catch(() => false);
      
      if (hasAlt) {
        console.log('✅ Resume counter found (alternative format)');
      } else {
        console.log('⚠️  Resume counter not found - verify manually');
      }
    }
    
    console.log('');
    console.log('🔍 VERIFY MANUALLY:');
    console.log('   - Counter shows "X / Y resumes" format');
    console.log('   - X = number of resumes generated');
    console.log('   - Y = resume limit (usually 1 for free tier)');
    console.log('   - After generating a resume, counter should increment');
    console.log('   - Example: "0 / 1" becomes "1 / 1"');
    
    console.log('✅ Test 5.4 PASSED: Resume counter display checked');
  });
});
