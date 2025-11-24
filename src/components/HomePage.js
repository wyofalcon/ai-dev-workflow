import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Tooltip, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BuildIcon from '@mui/icons-material/Build';
import TargetIcon from '@mui/icons-material/TrackChanges';
import HomeGraphic from './HomeGraphic.js';
import BuildResumeModal from './BuildResumeModal.js';
import { useAuth } from '../contexts/AuthContext.js';

function HomePage({ onStart }) {
  const navigate = useNavigate();
  const { createAuthAxios } = useAuth();
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [hasResumes, setHasResumes] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);

  // Check if user has any resumes
  useEffect(() => {
    const checkResumes = async () => {
      try {
        const axiosInstance = await createAuthAxios();
        const response = await axiosInstance.get('/resume');
        setHasResumes(response.data.resumes && response.data.resumes.length > 0);
      } catch (error) {
        console.error('Error checking resumes:', error);
        setHasResumes(false);
      } finally {
        setLoadingResumes(false);
      }
    };

    checkResumes();
  }, [createAuthAxios]);

  const options = [
    {
      id: 'build',
      title: 'BUILD NEW RESUME / UPLOAD EXISTING RESUME/CV',
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      tooltip: "Don't have a resume? CVstomize will guide you through the (often times daunting) process of building one.",
      action: () => setShowBuildModal(true),
      color: '#9d99e5',
      disabled: false,
    },
    {
      id: 'tailor',
      title: 'TAILOR TO SPECIFIC JOB',
      icon: <TargetIcon sx={{ fontSize: 40 }} />,
      tooltip: hasResumes 
        ? "Have at least one resume already? Cool, CVstomize will ask you a few questions and generate a tailored to fit resume specific to the provided job posting!"
        : "CVstomize needs at least 1 resume/cv for this option.",
      action: () => hasResumes && navigate('/create-resume'),
      color: '#fdbb2d',
      disabled: !hasResumes,
    },
  ];

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
      <HomeGraphic />
      <Typography variant="h3" component="h1" gutterBottom>
        You're more capable than you think. We'll prove it.
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 4, maxWidth: 600 }}>
        Choose your path:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        {options.map((option) => (
          <Tooltip
            key={option.id}
            title={option.tooltip}
            arrow
            placement="bottom"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(30, 30, 30, 0.95)',
                  color: '#e0e0e0',
                  fontSize: '0.9rem',
                  maxWidth: 300,
                  padding: 2,
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(30, 30, 30, 0.95)',
                  },
                },
              },
            }}
          >
            <Paper
              elevation={hoveredOption === option.id ? 8 : 2}
              onMouseEnter={() => !option.disabled && setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => !option.disabled && option.action && option.action()}
              sx={{
                width: { xs: '100%', sm: 240 },
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease-in-out',
                backgroundColor: hoveredOption === option.id ? option.color : '#1e1e1e',
                transform: hoveredOption === option.id ? 'scale(1.05)' : 'scale(1)',
                border: `2px solid ${hoveredOption === option.id ? option.color : '#333'}`,
                opacity: option.disabled ? 0.5 : 1,
                '&:hover': {
                  backgroundColor: option.disabled ? '#1e1e1e' : option.color,
                  borderColor: option.disabled ? '#333' : option.color,
                },
              }}
            >
              <Box
                sx={{
                  mb: 1.5,
                  color: hoveredOption === option.id ? '#000' : option.color,
                  transition: 'color 0.3s ease-in-out',
                }}
              >
                {option.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: hoveredOption === option.id ? '#000' : '#e0e0e0',
                  transition: 'color 0.3s ease-in-out',
                  px: 2,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                }}
              >
                {option.title}
              </Typography>
            </Paper>
          </Tooltip>
        ))}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 700, fontStyle: 'italic' }}>
        Answer our questions. Zero revisions needed. Our AI creates a perfectly tailored resume.
      </Typography>

      <BuildResumeModal open={showBuildModal} onClose={() => setShowBuildModal(false)} />
    </Box>
  );
}

export default HomePage;