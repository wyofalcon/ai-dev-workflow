import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import HomeGraphic from './HomeGraphic.js';

function HomePage({ onStart }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 200px)',
        textAlign: 'center',
      }}
    >
      <HomeGraphic /> {/* Add the graphic here */}
      <Typography variant="h3" component="h1" gutterBottom>
        Tell Your Story. Land The Job.
      </Typography>
      <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
        Let our AI help you craft the perfect resume from your unique experiences.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={onStart}
        sx={{
          padding: '20px 40px',
          fontSize: '1.2rem',
        }}
      >
        CVstomize the Story you want to tell your Future Employer HERE.
      </Button>
    </Box>
  );
}

export default HomePage;