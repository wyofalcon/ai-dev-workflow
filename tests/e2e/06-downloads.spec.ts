// Test Suite 6: Downloads & Export Features
// Based on COMPLETE_UI_TESTING_GUIDE.md Section 6

import { test, expect } from '@playwright/test';
import { CVstomizePage } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Downloads & Export Features', () => {
  let cvPage: CVstomizePage;

  test.beforeEach(async ({ page }) => {
    cvPage = new CVstomizePage(page);
    // Navigate to a resume that exists
    await cvPage.goto('/resume/1'); // Assumes resume ID 1 exists
  });

  test('6.1: Download Markdown (.md)', async ({ page }) => {
    const download = await cvPage.downloadMarkdown();
    
    // Verify download
    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.md$/);
    
    // Save and check file size
    const downloadPath = path.join('tests/reports', filename);
    await download.saveAs(downloadPath);
    
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(500); // At least 500 bytes
    expect(stats.size).toBeLessThan(50000); // Less than 50KB
    
    console.log(`✅ Test 6.1 PASSED: Markdown downloaded (${stats.size} bytes)`);
  });

  test('6.2: Download PDF - Modern Template', async ({ page }) => {
    const download = await cvPage.downloadPDF('modern');
    
    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/);
    expect(filename.toLowerCase()).toContain('modern');
    
    const downloadPath = path.join('tests/reports', filename);
    await download.saveAs(downloadPath);
    
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(10000); // At least 10KB
    expect(stats.size).toBeLessThan(500000); // Less than 500KB
    
    console.log(`✅ Test 6.2 PASSED: Modern PDF downloaded (${stats.size} bytes)`);
  });

  test('6.3: Download PDF - Classic Template', async ({ page }) => {
    const download = await cvPage.downloadPDF('classic');
    
    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/);
    
    const downloadPath = path.join('tests/reports', filename);
    await download.saveAs(downloadPath);
    
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(10000);
    
    console.log(`✅ Test 6.3 PASSED: Classic PDF downloaded (${stats.size} bytes)`);
  });

  test('6.4: Download PDF - Minimal Template', async ({ page }) => {
    const download = await cvPage.downloadPDF('minimal');
    
    expect(download).toBeTruthy();
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/);
    
    const downloadPath = path.join('tests/reports', filename);
    await download.saveAs(downloadPath);
    
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(10000);
    
    console.log(`✅ Test 6.4 PASSED: Minimal PDF downloaded (${stats.size} bytes)`);
  });

  test('6.5: Multiple Downloads (Same Resume)', async ({ page }) => {
    // Download all formats
    const mdDownload = await cvPage.downloadMarkdown();
    await page.waitForTimeout(1000);
    
    const modernDownload = await cvPage.downloadPDF('modern');
    await page.waitForTimeout(1000);
    
    const classicDownload = await cvPage.downloadPDF('classic');
    await page.waitForTimeout(1000);
    
    const minimalDownload = await cvPage.downloadPDF('minimal');
    
    // Verify all downloads
    expect(mdDownload).toBeTruthy();
    expect(modernDownload).toBeTruthy();
    expect(classicDownload).toBeTruthy();
    expect(minimalDownload).toBeTruthy();
    
    console.log('✅ Test 6.5 PASSED: All 4 formats downloaded successfully');
  });
});
