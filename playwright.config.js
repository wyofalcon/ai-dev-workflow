// Playwright Configuration for CVstomize E2E Testing
// Based on COMPLETE_UI_TESTING_GUIDE.md

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially for monitoring
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for easier monitoring
  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['list'], // Shows progress in terminal
    ['junit', { outputFile: 'tests/reports/junit.xml' }]
  ],
  
  use: {
    baseURL: 'https://cvstomize-frontend-351889420459.us-central1.run.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 120000, // 2 minutes per test (resume generation can take 30s)

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web server (optional - for local dev)
  // webServer: {
  //   command: 'npm start',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
