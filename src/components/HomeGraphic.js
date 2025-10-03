import React from 'react';
import { Box } from '@mui/material';

function HomeGraphic() {
  return (
    <Box sx={{ mb: 4 }}>
      <svg width="200" height="100" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#9d99e5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c1c3', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="80" rx="15" fill="url(#grad1)" />
        <rect x="60" y="20" width="130" height="60" rx="15" fill="url(#grad2)" opacity="0.7" />
      </svg>
    </Box>
  );
}

export default HomeGraphic;