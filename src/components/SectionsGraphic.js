import React from 'react';
import { Box } from '@mui/material';

function SectionsGraphic() {
  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <svg width="100" height="80" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c1c3', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="35" height="25" rx="5" fill="url(#grad2)" />
        <rect x="55" y="10" width="35" height="25" rx="5" fill="url(#grad2)" />
        <rect x="10" y="45" width="35" height="25" rx="5" fill="url(#grad2)" />
        <rect x="55" y="45" width="35" height="25" rx="5" fill="url(#grad2)" />
      </svg>
    </Box>
  );
}

export default SectionsGraphic;