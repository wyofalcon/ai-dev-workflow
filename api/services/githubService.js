// [FEAT-PORTFOLIO-001] GitHub Service
const logger = require('../utils/logger');

class GithubService {
  constructor() {
    this.pat = process.env.GITHUB_PAT;
    this.username = process.env.GITHUB_USERNAME || 'cvstomize-bot';
    this.octokit = null;
  }

  async getOctokit() {
    if (this.octokit) return this.octokit;

    if (!this.pat) {
      logger.warn('⚠️ GITHUB_PAT not set. Portfolio features will fail.');
      throw new Error('GitHub Personal Access Token (GITHUB_PAT) not configured');
    }

    try {
      // Dynamic import for ESM module in CJS
      const { Octokit } = await import('octokit');
      this.octokit = new Octokit({ auth: this.pat });
      return this.octokit;
    } catch (error) {
      logger.error('Failed to load Octokit:', error);
      throw error;
    }
  }

  async ensureRepo(repoName) {
    try {
      const octokit = await this.getOctokit();
      const { data } = await octokit.rest.repos.get({
        owner: this.username,
        repo: repoName,
      });
      return data;
    } catch (error) {
      if (error.status === 404) {
        // Create repo
        logger.info(`Creating GitHub repo: ${repoName}`);
        const octokit = await this.getOctokit();
        const { data } = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          private: false, // Pages on private repos requires Pro
          auto_init: true, // Create with README to have a branch
          description: 'Personal Portfolio powered by CVstomize',
        });
        return data;
      }
      throw error;
    }
  }

  async uploadFile(repoName, filePath, content, message = 'Update portfolio') {
    try {
      const octokit = await this.getOctokit();
      
      // Get file SHA if it exists
      let sha;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner: this.username,
          repo: repoName,
          path: filePath,
        });
        sha = data.sha;
      } catch (err) {
        // File doesn't exist yet
      }

      // Create or Update
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: this.username,
        repo: repoName,
        path: filePath,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
      });
      
      return data;
    } catch (error) {
      logger.error('GitHub Upload Failed:', error);
      throw error;
    }
  }

  async enablePages(repoName) {
    try {
      const octokit = await this.getOctokit();
      
      // Check if pages enabled
      try {
        await octokit.rest.repos.getPages({
          owner: this.username,
          repo: repoName,
        });
        return; // Already enabled
      } catch (err) {
        if (err.status !== 404) throw err;
      }

      // Enable Pages
      logger.info(`Enabling GitHub Pages for ${repoName}`);
      await octokit.rest.repos.createPagesSite({
        owner: this.username,
        repo: repoName,
        source: {
          branch: 'main',
          path: '/',
        },
      });
    } catch (error) {
      logger.error('Failed to enable GitHub Pages:', error);
      // Don't throw, might just need time or manual intervention
    }
  }

  getPagesUrl(repoName) {
    return `https://${this.username}.github.io/${repoName}/`;
  }
}

module.exports = new GithubService();
