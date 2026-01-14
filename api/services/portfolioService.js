const prisma = require('../config/database');
const githubService = require('./githubService');
const geminiService = require('./geminiServiceVertex');
const resumeContextAggregator = require('./resumeContextAggregator');
const logger = require('../utils/logger');

class PortfolioService {
  /**
   * Generate and deploy a personal portfolio website
   * @param {string} userId - User ID
   * @param {string} templateStyle - 'modern', 'minimal', 'creative'
   */
  async generatePortfolio(userId, templateStyle = 'modern') {
    logger.info(`Generating portfolio for user ${userId}`);

    // 1. Fetch User Profile & Context
    const userProfile = await prisma.userProfile.findUnique({ 
      where: { userId },
      include: { user: true } // to get email/name if needed
    });

    if (!userProfile) {
      throw new Error('User profile incomplete. Please complete your profile first.');
    }

    // Get richer context from resume history
    const resumeContext = await resumeContextAggregator.fetchResumeContext(userId);
    
    // Combine Data
    const fullProfile = {
      fullName: userProfile.fullName || userProfile.user.displayName || 'Portfolio Candidate',
      email: userProfile.user.email,
      ...userProfile,
      resumeContext: resumeContext || {} 
    };

    // 2. Generate HTML via AI
    logger.info('Generating portfolio HTML with Vertex AI...');
    const { portfolioHtml } = await geminiService.generatePortfolio(fullProfile, templateStyle);

    // 3. GitHub Operations
    // Repo name: portfolio-<short_uuid> to keep it reasonably short but unique
    const shortId = userId.split('-')[0]; 
    const repoName = `portfolio-${shortId}-${userId.substring(userId.length - 4)}`; // e.g. portfolio-a1b2c3d4-e5f6
    
    logger.info(`Deploying to GitHub repo: ${repoName}`);

    // Check/Create Repo
    await githubService.ensureRepo(repoName);

    // Upload index.html
    await githubService.uploadFile(repoName, 'index.html', portfolioHtml, `Update portfolio (${new Date().toISOString()})`);

    // Enable Pages (idempotent-ish)
    await githubService.enablePages(repoName);

    // 4. Update Database
    const githubUrl = githubService.getPagesUrl(repoName);
    
    const portfolio = await prisma.portfolio.upsert({
      where: { userId },
      update: {
        githubRepo: repoName,
        githubUrl: githubUrl,
        lastGeneratedAt: new Date(),
        templateType: templateStyle,
      },
      create: {
        userId,
        githubRepo: repoName,
        githubUrl: githubUrl,
        templateType: templateStyle,
      }
    });

    // Update UserProfile workPreferences with the new URL so it appears in the profile form
    const currentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (currentProfile) {
      const currentPrefs = currentProfile.workPreferences || {};
      await prisma.userProfile.update({
        where: { userId },
        data: {
          workPreferences: {
            ...currentPrefs,
            portfolioUrl: githubUrl
          }
        }
      });
    }

    logger.info(`Portfolio deployed to ${githubUrl}`);
    return portfolio;
  }

  async getPortfolio(userId) {
    return prisma.portfolio.findUnique({ where: { userId } });
  }
}

module.exports = new PortfolioService();
