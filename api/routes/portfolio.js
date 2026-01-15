const express = require('express');
const router = express.Router();
const portfolioService = require('../services/portfolioService');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

/**
 * POST /api/portfolio/generate
 * Trigger generation/update of the user's portfolio site
 */
router.post('/generate', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { templateStyle } = req.body; // 'modern', 'minimal', 'creative'
    
    // Check if system is configured
    if (!process.env.GITHUB_PAT) {
      return res.status(503).json({ 
        error: 'Service Unavailable', 
        message: 'Portfolio generation is currently disabled (missing configuration).' 
      });
    }

    const portfolio = await portfolioService.generatePortfolio(req.user.firebaseUid, templateStyle);
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio
 * Get current portfolio status
 */
router.get('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getPortfolio(req.user.firebaseUid);
    
    if (!portfolio) {
      return res.status(404).json({ 
        exists: false,
        message: 'No portfolio generated yet' 
      });
    }
    
    res.json({
      exists: true,
      ...portfolio
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
