import React from 'react';
import { Box } from '@mui/material';

function StoriesGraphic() {
  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <svg width="100" height="80" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c1c3', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path d="M 20 70 C 20 30, 80 30, 80 70" stroke="url(#grad2)" strokeWidth="5" fill="none" />
        <circle cx="35" cy="40" r="5" fill="url(#grad2)" />
        <circle cx="65" cy="40" r="5" fill="url(#grad2)" />
        <path d="M 40 60 Q 50 50 60 60" stroke="url(#grad2)" strokeWidth="5" fill="none" />
      </svg>
    </Box>
  );
}

export default StoriesGraphic;