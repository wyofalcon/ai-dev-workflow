// Set environment BEFORE any imports
process.env.NODE_ENV = 'test';

// Mocks
const mockPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  portfolio: {
    findUnique: jest.fn(),
    upsert: jest.fn()
  }
};

const mockGithubService = {
  ensureRepo: jest.fn(),
  uploadFile: jest.fn(),
  enablePages: jest.fn(),
  getPagesUrl: jest.fn()
};

const mockGeminiService = {
  generatePortfolio: jest.fn()
};

const mockResumeContextAggregator = {
  fetchResumeContext: jest.fn()
};

// Mock modules
jest.mock('../../../config/database', () => mockPrisma);
jest.mock('../../../services/githubService', () => mockGithubService);
jest.mock('../../../services/geminiServiceVertex', () => mockGeminiService);
jest.mock('../../../services/resumeContextAggregator', () => mockResumeContextAggregator);

const portfolioService = require('../../../services/portfolioService');

describe('Portfolio Service', () => {
  const userId = 'test-user-id';
  const repoName = 'portfolio-test-u-id';
  const githubUrl = 'https://test-user.github.io/portfolio-test-u-id/';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePortfolio', () => {
    it('should successfully generate and deploy a portfolio', async () => {
      // Setup mocks
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        userId,
        fullName: 'Test User',
        user: { email: 'test@example.com', displayName: 'Test User' }
      });

      mockResumeContextAggregator.fetchResumeContext.mockResolvedValue({
        skills: ['React', 'Node.js'],
        experience: [{ title: 'Developer', company: 'Tech Co' }]
      });

      mockGeminiService.generatePortfolio.mockResolvedValue({
        portfolioHtml: '<html><body>Portfolio</body></html>',
        tokensUsed: 100
      });

      mockGithubService.ensureRepo.mockResolvedValue({ name: repoName });
      mockGithubService.uploadFile.mockResolvedValue({ content: { sha: '123' } });
      mockGithubService.enablePages.mockResolvedValue({});
      mockGithubService.getPagesUrl.mockReturnValue(githubUrl);

      mockPrisma.portfolio.upsert.mockResolvedValue({
        userId,
        githubRepo: repoName,
        githubUrl,
        templateType: 'modern'
      });

      // Execute
      const result = await portfolioService.generatePortfolio(userId, 'modern');

      // Verify
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { user: true }
      });

      expect(mockResumeContextAggregator.fetchResumeContext).toHaveBeenCalledWith(userId);
      
      expect(mockGeminiService.generatePortfolio).toHaveBeenCalled();
      
      expect(mockGithubService.ensureRepo).toHaveBeenCalled();
      expect(mockGithubService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('portfolio-'),
        'index.html',
        expect.stringContaining('<html>'),
        expect.any(String)
      );
      expect(mockGithubService.enablePages).toHaveBeenCalled();
      
      expect(mockPrisma.portfolio.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: expect.objectContaining({ githubUrl }),
        create: expect.objectContaining({ githubUrl })
      });

      // Verify profile update
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          workPreferences: expect.objectContaining({
            portfolioUrl: githubUrl
          })
        })
      });

      expect(result).toEqual(expect.objectContaining({ githubUrl }));
    });

    it('should throw error if user profile is missing', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      await expect(portfolioService.generatePortfolio(userId))
        .rejects
        .toThrow('User profile incomplete');
    });

    it('should handle missing resume context gracefully', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        userId,
        user: { email: 'test@example.com' }
      });
      mockResumeContextAggregator.fetchResumeContext.mockResolvedValue(null);
      
      mockGeminiService.generatePortfolio.mockResolvedValue({
        portfolioHtml: '<html></html>'
      });
      
      mockGithubService.getPagesUrl.mockReturnValue(githubUrl);
      mockPrisma.portfolio.upsert.mockResolvedValue({});

      await portfolioService.generatePortfolio(userId);

      expect(mockGeminiService.generatePortfolio).toHaveBeenCalledWith(
        expect.objectContaining({ resumeContext: {} }),
        expect.any(String)
      );
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio if exists', async () => {
      const mockPortfolio = { userId, githubUrl };
      mockPrisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);

      const result = await portfolioService.getPortfolio(userId);
      expect(result).toEqual(mockPortfolio);
    });

    it('should return null if not found', async () => {
      mockPrisma.portfolio.findUnique.mockResolvedValue(null);
      const result = await portfolioService.getPortfolio(userId);
      expect(result).toBeNull();
    });
  });
});
