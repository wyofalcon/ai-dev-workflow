// Test Helpers and Page Object Models
import { Page, expect } from '@playwright/test';

export class CVstomizePage {
  constructor(public page: Page) {}

  // Navigation
  async goto(path = '/') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // Authentication helpers
  async clickLogin() {
    await this.page.getByRole('button', { name: /login/i }).click();
  }

  async clickSignup() {
    await this.page.getByRole('button', { name: /sign up/i }).click();
  }

  async signInWithGoogle() {
    await this.page.getByRole('button', { name: /sign in with google/i }).click();
  }

  async fillEmailPasswordForm(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/^password$/i).fill(password);
  }

  async submitLoginForm() {
    await this.page.getByRole('button', { name: /sign in|log in/i }).click();
  }

  // Profile helpers
  async waitForProfileToLoad() {
    await this.page.waitForSelector('[data-testid="user-avatar"], .MuiAvatar-root', { timeout: 10000 });
  }

  async getResumeCount() {
    const text = await this.page.locator('text=/\\d+ \\/ \\d+ resumes/').textContent();
    const match = text?.match(/(\d+) \/ (\d+)/);
    return match ? { generated: parseInt(match[1]), limit: parseInt(match[2]) } : null;
  }

  // Resume creation helpers
  async clickCreateResume() {
    await this.page.getByRole('button', { name: /create.*resume/i }).click();
  }

  async pasteJobDescription(jd: string) {
    const textarea = this.page.locator('textarea[placeholder*="job description" i], textarea[name*="job" i]').first();
    await textarea.fill(jd);
  }

  async clickAnalyzeOrNext() {
    const button = this.page.getByRole('button', { name: /(analyze|next|continue)/i });
    await button.click();
  }

  async waitForQuestionsToGenerate() {
    await this.page.waitForSelector('text=/answer.*question/i', { timeout: 30000 });
  }

  async answerQuestions(answers: string[]) {
    const inputs = await this.page.locator('textarea, input[type="text"]').filter({
      has: this.page.locator(':visible')
    }).all();

    for (let i = 0; i < Math.min(answers.length, inputs.length); i++) {
      await inputs[i].fill(answers[i]);
      await this.page.waitForTimeout(500); // Small delay between answers
    }
  }

  async clickGenerateResume() {
    await this.page.getByRole('button', { name: /generate.*resume/i }).click();
  }

  async waitForResumeGeneration(timeout = 60000) {
    // Wait for loading to finish
    await this.page.waitForSelector('text=/generating|processing/i', { state: 'hidden', timeout });
    // Wait for success message or resume content
    await this.page.waitForSelector('text=/ready|complete|download/i', { timeout });
  }

  // Profile completion modal
  async fillProfileModal(data: { fullName: string; phone: string; location: string; linkedinUrl: string }) {
    await this.page.getByLabel(/full name/i).fill(data.fullName);
    await this.page.getByLabel(/phone/i).fill(data.phone);
    await this.page.getByLabel(/location/i).fill(data.location);
    await this.page.getByLabel(/linkedin/i).fill(data.linkedinUrl);
  }

  async clickSaveProfile() {
    await this.page.getByRole('button', { name: /save.*continue/i }).click();
  }

  async clickSkipProfile() {
    await this.page.getByRole('button', { name: /skip/i }).click();
  }

  // Resume history
  async navigateToResumeHistory() {
    await this.page.getByRole('button', { name: /avatar|account/i }).click();
    await this.page.getByRole('menuitem', { name: /my resumes/i }).click();
  }

  async searchResumes(query: string) {
    await this.page.getByPlaceholder(/search/i).fill(query);
  }

  async filterByStatus(status: string) {
    await this.page.getByLabel(/filter.*status/i).click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
  }

  async getResumeCardCount() {
    return await this.page.locator('.MuiCard-root, [data-testid="resume-card"]').count();
  }

  async clickResumeAction(index: number, action: 'view' | 'download' | 'delete') {
    const card = this.page.locator('.MuiCard-root, [data-testid="resume-card"]').nth(index);
    
    const iconMap = {
      view: 'visibility',
      download: 'download',
      delete: 'delete'
    };
    
    await card.locator(`[data-testid="${action}-icon"], .MuiIconButton-root`).filter({
      has: this.page.locator(`[data-testid*="${iconMap[action]}"]`)
    }).click();
  }

  // Download helpers
  async downloadMarkdown() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: /download.*markdown/i }).click();
    return await downloadPromise;
  }

  async downloadPDF(template: 'modern' | 'classic' | 'minimal') {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: new RegExp(`pdf.*${template}`, 'i') }).click();
    return await downloadPromise;
  }

  // Assertions
  async expectContactInfoToShow(name: string) {
    await expect(this.page.locator('text=' + name)).toBeVisible();
  }

  async expectNoPlaceholders() {
    const content = await this.page.content();
    expect(content).not.toContain('[Your Company]');
    expect(content).not.toContain('[City, State]');
    expect(content).not.toContain('Alex Johnson');
    expect(content).not.toContain('John Doe');
  }

  async expectNo11Questions() {
    const content = await this.page.textContent('body');
    expect(content).not.toContain('11 questions');
  }
}

// Utility functions
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/reports/screenshots/${name}.png`, fullPage: true });
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout = 30000) {
  return await page.waitForResponse(
    (response: any) => (typeof urlPattern === 'string' ? response.url().includes(urlPattern) : urlPattern.test(response.url())),
    { timeout }
  );
}
