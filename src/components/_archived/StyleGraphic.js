import React from 'react';
import { Box } from '@mui/material';

function StyleGraphic() {
  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <svg width="100" height="80" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#9d99e5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="30" cy="40" r="20" fill="url(#grad1)" />
        <path d="M 50 20 L 90 20 L 70 60 L 30 60 Z" fill="url(#grad1)" opacity="0.7" />
      </svg>
    </Box>
  );
}

export default StyleGraphic;