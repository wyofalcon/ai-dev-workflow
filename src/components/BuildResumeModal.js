import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Paper,
  Chip,
  FormGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';

const RESUME_SECTIONS = [
  'Professional Summary',
  'Work Experience',
  'Education',
  'Skills',
  'Certifications',
  'Projects',
  'Volunteer Experience',
  'Publications',
  'Awards & Honors',
  'Languages',
];

function BuildResumeModal({ open, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    jobPosting: '',
    uploadedResume: null,
    uploadedResumeText: '',
    selectedSections: ['Professional Summary', 'Work Experience', 'Education', 'Skills'],
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
    },
  });

  const steps = [
    'Job Posting',
    'Upload Resume (Optional)',
    'Select Sections',
    'Personal Information',
    'Review & Generate',
  ];

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setActiveStep(0);
    setLoading(false);
    setError(null);
    setFormData({
      jobPosting: '',
      uploadedResume: null,
      uploadedResumeText: '',
      selectedSections: ['Professional Summary', 'Work Experience', 'Education', 'Skills'],
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
      },
    });
    onClose();
  };

  const handleSectionToggle = (section) => {
    setFormData((prev) => ({
      ...prev,
      selectedSections: prev.selectedSections.includes(section)
        ? prev.selectedSections.filter((s) => s !== section)
        : [...prev.selectedSections, section],
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, uploadedResume: file }));

      // Extract text from uploaded resume
      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
        const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

        const formData = new FormData();
        formData.append('resumes', file);

        const response = await fetch(`${API_URL}/resume/extract-text`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to extract text from resume');
        }

        const data = await response.json();
        setFormData((prev) => ({ ...prev, uploadedResumeText: data.text }));

      } catch (err) {
        console.error('Error extracting resume text:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
      const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

      const response = await fetch(`${API_URL}/resume/build-new`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobPosting: formData.jobPosting,
          selectedSections: formData.selectedSections,
          personalInfo: formData.personalInfo,
          uploadedResumeText: formData.uploadedResumeText || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }

      const data = await response.json();

      // Close modal and navigate to resume view
      handleClose();
      navigate(`/resume/${data.resume.id}`);

    } catch (err) {
      console.error('Error generating resume:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Paste the Job Posting
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Copy and paste the full job description you're applying for. This helps CVstomize tailor your resume perfectly.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={12}
              placeholder="Paste the job posting here..."
              value={formData.jobPosting}
              onChange={(e) => setFormData({ ...formData, jobPosting: e.target.value })}
              variant="outlined"
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Existing Resume (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Have an existing resume? Upload it and we'll extract the information. Otherwise, we'll guide you through creating one from scratch.
            </Typography>
            <Box
              component="label"
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: '2px dashed #333',
                borderRadius: 1,
                backgroundColor: '#1a1a1a',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                userSelect: 'none',
                '&:hover': {
                  borderColor: '#fdbb2d',
                  backgroundColor: '#252525',
                },
              }}
            >
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
              <CloudUploadIcon sx={{ fontSize: 60, color: '#fdbb2d', mb: 2 }} />
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {formData.uploadedResume
                  ? `Selected: ${formData.uploadedResume.name}`
                  : 'Click to upload'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PDF, DOC, or DOCX (Max 10MB)
              </Typography>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Resume Sections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose which sections you want to include in your resume. You can always customize this later.
            </Typography>
            <FormGroup>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {RESUME_SECTIONS.map((section) => (
                  <Chip
                    key={section}
                    label={section}
                    onClick={() => handleSectionToggle(section)}
                    color={formData.selectedSections.includes(section) ? 'secondary' : 'default'}
                    variant={formData.selectedSections.includes(section) ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.9rem', py: 2 }}
                  />
                ))}
              </Box>
            </FormGroup>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide your contact information. This will appear at the top of your resume.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.personalInfo.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, fullName: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, email: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.personalInfo.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, phone: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Location (City, State)"
                value={formData.personalInfo.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalInfo: { ...formData.personalInfo, location: e.target.value },
                  })
                }
              />
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Generate
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your selections and click "Generate Resume" to create your AI-powered resume.
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', mb: 2 }}>
              <Typography variant="subtitle2" color="secondary">Job Posting:</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {formData.jobPosting ? `${formData.jobPosting.substring(0, 100)}...` : 'Not provided'}
              </Typography>
              
              <Typography variant="subtitle2" color="secondary" sx={{ mt: 2 }}>Uploaded Resume:</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {formData.uploadedResume ? formData.uploadedResume.name : 'None'}
              </Typography>
              
              <Typography variant="subtitle2" color="secondary" sx={{ mt: 2 }}>Selected Sections:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {formData.selectedSections.map((section) => (
                  <Chip key={section} label={section} size="small" color="secondary" />
                ))}
              </Box>
              
              <Typography variant="subtitle2" color="secondary" sx={{ mt: 2 }}>Personal Info:</Typography>
              <Typography variant="body2">
                {formData.personalInfo.fullName || 'Not provided'}
                {formData.personalInfo.email && ` • ${formData.personalInfo.email}`}
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          minHeight: '70vh',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <Typography variant="h6">Build New Resume</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          pt: 3, 
          pb: 2, 
          px: 2,
          '& .MuiStepConnector-line': {
            borderColor: '#333',
          },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333' }}>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={loading}
          onClick={activeStep === steps.length - 1 ? handleGenerate : handleNext}
          endIcon={loading ? <CircularProgress size={20} /> : (activeStep === steps.length - 1 ? null : <ArrowForwardIcon />)}
        >
          {activeStep === steps.length - 1 ? 'Generate Resume' : 'Next'}
        </Button>
      </Box>
    </Dialog>
  );
}

export default BuildResumeModal;
