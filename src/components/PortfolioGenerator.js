import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress, 
  Link,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  Language as WebIcon, 
  AutoAwesome as AiIcon, 
  GitHub as GitHubIcon,
  Refresh as RefreshIcon,
  ViewQuilt as ModernIcon,
  CropSquare as MinimalIcon,
  Brush as CreativeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function PortfolioGenerator() {
  const { createAuthAxios } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(null);
  const [templateStyle, setTemplateStyle] = useState('modern');

  // Fetch existing portfolio status on mount
  useEffect(() => {
    fetchPortfolioStatus();
  }, []);

  const fetchPortfolioStatus = async () => {
    try {
      const axios = await createAuthAxios();
      const response = await axios.get('/portfolio');
      if (response.data.exists) {
        setPortfolio(response.data);
        if (response.data.templateType) {
          setTemplateStyle(response.data.templateType);
        }
      }
    } catch (err) {
      // 404 is expected if not generated yet
      if (err.response?.status !== 404) {
        console.error('Failed to fetch portfolio status', err);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const axios = await createAuthAxios();
      const response = await axios.post('/portfolio/generate', {
        templateStyle: templateStyle 
      });
      setPortfolio(response.data);
    } catch (err) {
      console.error('Portfolio generation failed', err);
      setError(err.response?.data?.message || 'Failed to generate portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (event, newStyle) => {
    if (newStyle !== null) {
      setTemplateStyle(newStyle);
    }
  };

  return (
    <Card sx={{ mt: 3, mb: 3, borderRadius: 2, background: 'linear-gradient(to right, #f8f9fa, #e9ecef)' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <WebIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Your Personal Portfolio Website
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Turn your profile into a live website hosted on GitHub Pages.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={templateStyle}
            exclusive
            onChange={handleStyleChange}
            aria-label="portfolio style"
            size="small"
            disabled={loading}
          >
            <ToggleButton value="modern" aria-label="modern">
              <ModernIcon sx={{ mr: 1, fontSize: 18 }} />
              Modern
            </ToggleButton>
            <ToggleButton value="minimal" aria-label="minimal">
              <MinimalIcon sx={{ mr: 1, fontSize: 18 }} />
              Minimal
            </ToggleButton>
            <ToggleButton value="creative" aria-label="creative">
              <CreativeIcon sx={{ mr: 1, fontSize: 18 }} />
              Creative
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {portfolio ? (
          <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: '1px solid #dee2e6' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Chip 
                  icon={<AiIcon />} 
                  label={`AI Generated (${templateStyle})`} 
                  color="success" 
                  size="small" 
                  variant="outlined" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="h5" component="div" fontWeight="bold" color="primary">
                  <Link href={portfolio.githubUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                    View My Website
                  </Link>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {new Date(portfolio.lastGeneratedAt).toLocaleString()}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Regenerate Website'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" py={2}>
            <Typography variant="body1" align="center" sx={{ mb: 2, maxWidth: 500 }}>
              Use Vertex AI to build a professional, responsive portfolio website showcasing your experience, skills, and resume. No coding required.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AiIcon />}
              onClick={handleGenerate}
              disabled={loading}
              sx={{ 
                px: 4, 
                py: 1.5,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
              }}
            >
              {loading ? 'Building Website...' : 'Generate My Website'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
