import React from 'react';
import { Box } from '@mui/material';

function JobDescriptionGraphic() {
  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <svg width="100" height="80" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#9d99e5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="60" rx="5" stroke="url(#grad1)" strokeWidth="5" fill="none" />
        <line x1="20" y1="25" x2="80" y2="25" stroke="url(#grad1)" strokeWidth="3" />
        <line x1="20" y1="35" x2="80" y2="35" stroke="url(#grad1)" strokeWidth="3" />
        <line x1="20" y1="45" x2="60" y2="45" stroke="url(#grad1)" strokeWidth="3" />
      </svg>
    </Box>
  );
}

export default JobDescriptionGraphic;