import React, { useState } from 'react';
import { Box, Typography, IconButton, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * A banner to inform users that the site is under active development.
 * Dismissible and persists dismissal in localStorage.
 */
function DevelopmentBanner() {
  const [dismissed, setDismissed] = useState(() => {
    // Check if user has dismissed the banner before
    return localStorage.getItem('devBannerDismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('devBannerDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 1.5,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: '900px',
        }}
      >
        🚧 <strong>Under Active Development</strong> — This is an early preview version. 
        The current features are available for use, but a major update is coming soon with 
        user accounts, saved resumes, and AI-powered personality matching!{' '}
        <Link
          href="https://github.com/wyofalcon/cvstomize"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#ffd700', textDecoration: 'underline' }}
        >
          Follow progress on GitHub
        </Link>
      </Typography>
      <IconButton
        onClick={handleDismiss}
        size="small"
        sx={{
          color: 'white',
          position: 'absolute',
          right: 8,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
        aria-label="Dismiss banner"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default DevelopmentBanner;
