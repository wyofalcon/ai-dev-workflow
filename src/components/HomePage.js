import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HomeGraphic from './HomeGraphic.js';
import logo from './logo.png';

function HomePage({ onStart }) {
  const navigate = useNavigate();

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
      <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
        Let our AI help you craft the perfect resume from your unique experiences.
      </Typography>

      {/* NEW: Highlight the conversational flow */}
      <Chip
        label="NEW: Job-Description-First AI Resume Builder"
        color="secondary"
        icon={<AutoAwesomeIcon />}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => navigate('/create-resume')}
          sx={{
            padding: '20px 40px',
            fontSize: '1.2rem',
          }}
        >
          Try New AI Resume Builder
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={onStart}
          sx={{
            padding: '20px 40px',
            fontSize: '1.2rem',
          }}
        >
          Use Classic Builder
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
        <strong>New:</strong> Answer 11 questions in 10 minutes. Zero revisions needed.
        Our AI analyzes your target job and creates a perfectly tailored resume.
      </Typography>
    </Box>
  );
}

export default HomePage;