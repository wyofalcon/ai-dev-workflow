import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReactMarkdown from 'react-markdown';
import { auth } from '../firebase/index.js';

/**
 * Resume View Page
 *
 * Displays a generated resume with download options.
 * Loads resume data from backend API by resumeId.
 *
 * Route: /resume/:id
 */
function ResumeViewPage() {
  const { id: resumeId } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

  // Load resume data on mount
  useEffect(() => {
    loadResume();
  }, [resumeId]);

  const loadResume = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log('📥 Loading resume:', resumeId);

      const response = await fetch(`${API_BASE}/api/resume/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load resume');
      }

      console.log('✅ Resume loaded:', data.resume.id);
      setResume(data.resume);

    } catch (err) {
      console.error('❌ Load resume error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    setDownloading(true);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log('📥 Downloading markdown for resume:', resumeId);

      // Fetch the file from backend
      const response = await fetch(`${API_BASE}/api/resume/${resumeId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download resume');
      }

      // Get the blob
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'resume.md';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ Download complete:', filename);

    } catch (err) {
      console.error('❌ Download error:', err);
      setError('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async (template = 'modern') => {
    setDownloading(true);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log(`📥 Downloading PDF (${template}) for resume:`, resumeId);

      // Open in new window to trigger download
      const url = `${API_BASE}/api/resume/${resumeId}/pdf?template=${template}`;

      // Use fetch to get auth header
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `resume_${template}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      console.log('✅ PDF download complete');

    } catch (err) {
      console.error('❌ PDF download error:', err);
      setError('PDF download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Loading your resume...
        </Typography>
      </Container>
    );
  }

  if (error && !resume) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/create-resume')}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/create-resume')}
          sx={{ mb: 2 }}
        >
          Create Another Resume
        </Button>

        <Typography variant="h4" gutterBottom fontWeight="bold">
          Your Generated Resume
        </Typography>

        {resume?.job_title && (
          <Chip label={`For: ${resume.job_title}`} color="primary" sx={{ mb: 2 }} />
        )}

        <Typography variant="body2" color="text.secondary">
          Generated on {new Date(resume?.created_at).toLocaleDateString()} at {new Date(resume?.created_at).toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Download Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="500">
          Download Options
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose your preferred format to download your resume
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleDownloadMarkdown}
              disabled={downloading}
              size="large"
            >
              Markdown (.md)
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleDownloadPDF('classic')}
              disabled={downloading}
              size="large"
            >
              PDF - Classic
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleDownloadPDF('modern')}
              disabled={downloading}
              size="large"
            >
              PDF - Modern
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleDownloadPDF('minimal')}
              disabled={downloading}
              size="large"
            >
              PDF - Minimal
            </Button>
          </Grid>
        </Grid>

        {downloading && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Preparing download...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* ATS Analysis (if available) */}
      {resume?.ats_analysis && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="500">
              ATS Compatibility Score
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                label={`Score: ${resume.ats_analysis.score || 'N/A'}%`}
                color={resume.ats_analysis.score >= 80 ? 'success' : 'warning'}
              />
              <Chip
                label={`Grade: ${resume.ats_analysis.grade || 'N/A'}`}
                color="primary"
              />
            </Box>
            {resume.ats_analysis.summary && (
              <Typography variant="body2" color="text.secondary">
                {resume.ats_analysis.summary}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Resume Preview */}
      <Paper elevation={1} sx={{ p: 4, backgroundColor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom fontWeight="500" sx={{ mb: 3 }}>
          Resume Preview
        </Typography>

        <Box
          sx={{
            '& h1': { fontSize: '2rem', fontWeight: 700, mb: 1 },
            '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 3, mb: 2, borderBottom: '2px solid #333', pb: 1 },
            '& h3': { fontSize: '1.25rem', fontWeight: 500, mt: 2, mb: 1 },
            '& p': { mb: 1, lineHeight: 1.6 },
            '& ul': { ml: 3, mb: 2 },
            '& li': { mb: 0.5 }
          }}
        >
          <ReactMarkdown>
            {resume?.content || 'No content available'}
          </ReactMarkdown>
        </Box>
      </Paper>
    </Container>
  );
}

export default ResumeViewPage;
