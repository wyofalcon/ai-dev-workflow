import React from 'react';
import { Box } from '@mui/material';

function UploadGraphic() {
  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <svg width="100" height="80" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#9d99e5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fdbb2d', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path d="M 20 40 L 50 10 L 80 40" stroke="url(#grad1)" strokeWidth="5" fill="none" />
        <path d="M 50 10 L 50 70" stroke="url(#grad1)" strokeWidth="5" fill="none" />
        <path d="M 10 70 L 90 70" stroke="url(#grad1)" strokeWidth="5" fill="none" />
      </svg>
    </Box>
  );
}

export default UploadGraphic;