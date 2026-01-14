const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// Using Google Custom Search JSON API
// Requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX (Search Engine ID) env vars
router.get('/company', verifyFirebaseToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    // Fallback if keys are missing (mock response for dev/demo)
    if (!apiKey || !cx) {
      console.warn('⚠️ Google Search API keys missing. Returning mock data.');
      return res.json({
        items: [
          {
            title: `${query} (Mock Result)`,
            snippet: `Mock address for ${query}: 123 Innovation Dr, Tech City, TC 90210. Phone: (555) 123-4567.`,
            link: "https://example.com"
          },
          {
            title: `${query} Headquarters`,
            snippet: `Corporate HQ: 456 Corporate Blvd, Business Town.`,
            link: "https://example.com/hq"
          }
        ]
      });
    }

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: query,
        num: 3 // We only need top few results
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Search API Error:', error.message);
    res.status(500).json({ message: 'Failed to perform search' });
  }
});

module.exports = router;
