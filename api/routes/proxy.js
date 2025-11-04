const express = require('express');
const router = express.Router();
const https = require('https');

/**
 * GET /api/proxy/avatar
 * Proxy Google profile images to bypass CORS/ORB restrictions
 */
router.get('/avatar', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Only allow Googleusercontent URLs
    if (!url.startsWith('https://lh3.googleusercontent.com/')) {
      return res.status(403).json({ error: 'Only Google profile images are allowed' });
    }

    // Fetch the image from Google using https module
    https.get(url, (imageRes) => {
      // Set appropriate headers
      res.set('Content-Type', imageRes.headers['content-type'] || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

      // Pipe the image directly to the response
      imageRes.pipe(res);
    }).on('error', (error) => {
      console.error('❌ Error proxying avatar:', error.message);
      res.status(500).json({ error: 'Failed to load avatar' });
    });
  } catch (error) {
    console.error('❌ Error proxying avatar:', error.message);
    res.status(500).json({ error: 'Failed to load avatar' });
  }
});

module.exports = router;
