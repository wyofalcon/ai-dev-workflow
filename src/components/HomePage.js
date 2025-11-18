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

      <Button
        variant="contained"
        color="secondary"
        size="large"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => navigate('/create-resume')}
        sx={{
          padding: '20px 40px',
          fontSize: '1.2rem',
          mb: 3,
        }}
      >
        Create Your AI Resume
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
        Answer our questions. Zero revisions needed.
        Our AI analyzes your target job and creates a perfectly tailored resume.
      </Typography>
    </Box>
  );
}

export default HomePage;