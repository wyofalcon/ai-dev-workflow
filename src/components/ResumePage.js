import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const ResumePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

        const response = await fetch(`${API_BASE}/api/resume/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch resumes: ${response.statusText}`);
        }

        const data = await response.json();
        setResumes(data.resumes || []);
        setFilteredResumes(data.resumes || []);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError(err.message || 'Failed to load resumes');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchResumes();
    }
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...resumes];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(resume => resume.status === filterStatus);
    }

    // Filter by search query (title or company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resume =>
        (resume.title?.toLowerCase().includes(query)) ||
        (resume.targetCompany?.toLowerCase().includes(query))
      );
    }

    setFilteredResumes(filtered);
  }, [filterStatus, searchQuery, resumes]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'draft':
        return 'default';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Handle delete resume
  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

      const response = await fetch(`${API_BASE}/api/resume/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from local state
        setResumes(prev => prev.filter(r => r.id !== resumeId));
        setFilteredResumes(prev => prev.filter(r => r.id !== resumeId));
      } else {
        const data = await response.json();
        alert(`Failed to delete resume: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert('Failed to delete resume');
    }
  };

  // Handle download (navigate to view page with download intent)
  const handleDownload = (resumeId) => {
    navigate(`/resume/${resumeId}?download=true`);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your resumes...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Toolbar>
          <IconButton edge="start" color="primary" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My Resumes
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-resume')}
          >
            Create New Resume
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search resumes"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 250 }}
          />
          <TextField
            select
            label="Filter by status"
            variant="outlined"
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </TextField>
        </Box>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredResumes.length} of {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
        </Typography>

        {/* Empty State */}
        {filteredResumes.length === 0 && resumes.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>
              No resumes yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first AI-powered resume in minutes
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-resume')}
            >
              Create Your First Resume
            </Button>
          </Box>
        )}

        {/* No Results from Filter */}
        {filteredResumes.length === 0 && resumes.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No resumes match your filters
            </Typography>
            <Button onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}>
              Clear Filters
            </Button>
          </Box>
        )}

        {/* Resume Cards */}
        <Grid container spacing={3}>
          {filteredResumes.map((resume) => (
            <Grid item xs={12} sm={6} md={4} key={resume.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Title */}
                  <Typography variant="h6" gutterBottom noWrap>
                    {resume.title || 'Untitled Resume'}
                  </Typography>

                  {/* Company */}
                  {resume.targetCompany && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {resume.targetCompany}
                    </Typography>
                  )}

                  {/* Status */}
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Chip
                      label={resume.status || 'draft'}
                      color={getStatusColor(resume.status)}
                      size="small"
                    />
                  </Box>

                  {/* Dates */}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Created: {formatDate(resume.createdAt)}
                  </Typography>
                  {resume.downloadedAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Downloaded: {formatDate(resume.downloadedAt)}
                    </Typography>
                  )}

                  {/* Token Usage */}
                  {resume.tokensUsed && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      AI Tokens: {resume.tokensUsed.toLocaleString()}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  {/* View Button */}
                  <Tooltip title="View resume">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/resume/${resume.id}`)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Download Button */}
                  <Tooltip title="Download resume">
                    <IconButton
                      color="primary"
                      onClick={() => handleDownload(resume.id)}
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>

                  {/* Delete Button */}
                  <Tooltip title="Delete resume">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(resume.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default ResumePage;
