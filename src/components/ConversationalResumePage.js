import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Alert } from '@mui/material';
import ConversationalWizard from './ConversationalWizard.js';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * Conversational Resume Page
 *
 * New resume building experience using Job-Description-First approach.
 * Replaces the old wizard with a conversational flow.
 */
function ConversationalResumePage() {
  const navigate = useNavigate();
  const [generatedResume, setGeneratedResume] = useState(null);

  const handleResumeGenerated = (resumeData) => {
    console.log('Resume generated successfully:', resumeData);
    setGeneratedResume(resumeData);
  };

  const handleViewResume = () => {
    // API returns: { resume: { id: ... } }
    if (generatedResume?.resume?.id) {
      navigate(`/resume/${generatedResume.resume.id}`);
    }
  };

  const handleCreateAnother = () => {
    setGeneratedResume(null);
    window.location.reload(); // Reset wizard
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Create Your Perfect Resume
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Answer our questions • Zero revisions needed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Our AI analyzes your target job and asks targeted questions about your experience.
            The result: A resume that positions you as a must-interview candidate.
          </Typography>
        </Box>

        {/* Success State */}
        {generatedResume ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
              Your Resume is Ready!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We've created a tailored resume that highlights your strengths for this specific role.
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleViewResume}
              >
                View & Download Resume
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleCreateAnother}
              >
                Create Another Resume
              </Button>
            </Box>

            {generatedResume.usage && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  You've used {generatedResume.usage.resumesGenerated} of {generatedResume.usage.resumesLimit} resumes this month.
                  {generatedResume.usage.remaining > 0
                    ? ` ${generatedResume.usage.remaining} remaining.`
                    : ' Upgrade for unlimited resumes!'}
                </Typography>
              </Alert>
            )}
          </Paper>
        ) : (
          /* Conversational Wizard */
          <ConversationalWizard onComplete={handleResumeGenerated} />
        )}

        {/* How It Works */}
        {!generatedResume && (
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              How This Works
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mt: 3 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                  1. Paste Job Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI analyzes the role's requirements, skills, and culture to generate targeted questions.
                </Typography>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                  2. Answer Our Questions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tell us about your experiences. Each answer serves two purposes: resume content + personality insights.
                </Typography>
              </Paper>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                  3. Get Perfect Resume
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI creates a resume tailored to the job, matching keywords and positioning you for success.
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default ConversationalResumePage;
