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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

function UploadResumeModal({ open, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    uploadedFile: null,
    extractedText: '',
    jobPosting: '',
    selectedSections: ['Professional Summary', 'Work Experience', 'Education', 'Skills'],
  });

  const steps = [
    'Upload Resume',
    'Target Job Posting',
    'Select Sections',
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
      uploadedFile: null,
      extractedText: '',
      jobPosting: '',
      selectedSections: ['Professional Summary', 'Work Experience', 'Education', 'Skills'],
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
    if (!file) return;

    setFormData((prev) => ({ ...prev, uploadedFile: file }));

    // Extract text from uploaded resume
    try {
      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
      const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

      const formDataUpload = new FormData();
      formDataUpload.append('resumes', file);

      const response = await fetch(`${API_URL}/resume/extract-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from resume');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, extractedText: data.text }));

      // Auto-advance to next step on successful upload
      setTimeout(() => {
        setActiveStep(1);
      }, 500);

    } catch (err) {
      console.error('Error extracting resume text:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';
      const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

      const response = await fetch(`${API_URL}/resume/enhance-uploaded`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extractedResumeText: formData.extractedText,
          jobPosting: formData.jobPosting,
          selectedSections: formData.selectedSections
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance resume');
      }

      const data = await response.json();

      // Close modal and navigate to resume view
      handleClose();
      navigate(`/resume/${data.resume.id}`);

    } catch (err) {
      console.error('Error enhancing resume:', err);
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
              Upload or Paste Your Existing Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload your resume file or paste the text directly below. We'll extract the information to create an enhanced, tailored version.
            </Typography>

            {/* File Upload Section */}
            <Box
              component="label"
              sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: formData.extractedText && formData.uploadedFile ? '2px solid #4caf50' : '2px dashed #333',
                borderRadius: 1,
                backgroundColor: formData.extractedText && formData.uploadedFile ? '#1a2e1a' : '#1a1a1a',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                userSelect: 'none',
                '&:hover': {
                  borderColor: formData.extractedText && formData.uploadedFile ? '#4caf50' : '#fdbb2d',
                  backgroundColor: formData.extractedText && formData.uploadedFile ? '#1a2e1a' : '#252525',
                },
              }}
            >
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={loading}
              />
              {formData.extractedText && formData.uploadedFile ? (
                <>
                  <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1, color: '#4caf50' }}>
                    Resume Uploaded Successfully!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 0.5 }}>
                    {formData.uploadedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(formData.extractedText.length / 1000).toFixed(1)}k characters extracted
                  </Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setFormData((prev) => ({ ...prev, uploadedFile: null, extractedText: '' }));
                    }}
                  >
                    Upload Different File
                  </Button>
                </>
              ) : loading ? (
                <>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    Extracting text from resume...
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 80, color: '#fdbb2d', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Click to upload file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, DOC, or DOCX (Max 25MB)
                  </Typography>
                </>
              )}
            </Box>

            {/* OR Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
            </Box>

            {/* Text Paste Section */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Paste your resume text directly:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="Paste your existing resume here...&#10;&#10;Include all sections: work experience, education, skills, etc."
                value={formData.extractedText && !formData.uploadedFile ? formData.extractedText : ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    extractedText: e.target.value,
                    uploadedFile: null // Clear file upload if pasting text
                  }));
                }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: formData.extractedText && !formData.uploadedFile ? '#1a2e1a' : 'transparent',
                    borderColor: formData.extractedText && !formData.uploadedFile ? '#4caf50' : '#333',
                  }
                }}
                disabled={loading}
              />
              {formData.extractedText && !formData.uploadedFile && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  ✅ {(formData.extractedText.length / 1000).toFixed(1)}k characters pasted
                </Typography>
              )}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Target Job Posting
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste the full job description you're applying for. We'll tailor your resume to match this role.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={14}
              placeholder="Paste the job posting here..."
              value={formData.jobPosting}
              onChange={(e) => setFormData({ ...formData, jobPosting: e.target.value })}
              variant="outlined"
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Resume Sections
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose which sections to include in your enhanced resume.
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
              Review & Generate
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your selections and click "Enhance Resume" to generate your optimized resume.
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', mb: 2 }}>
              <Typography variant="subtitle2" color="secondary">Uploaded Resume:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {formData.uploadedFile?.name || 'None'}
              </Typography>

              <Typography variant="subtitle2" color="secondary">Job Posting:</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {formData.jobPosting ? `${formData.jobPosting.substring(0, 100)}...` : 'Not provided'}
              </Typography>

              <Typography variant="subtitle2" color="secondary">Selected Sections:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {formData.selectedSections.map((section) => (
                  <Chip key={section} label={section} size="small" color="secondary" />
                ))}
              </Box>
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
        <Typography variant="h6">Upload & Enhance Resume</Typography>
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
          disabled={loading || (activeStep === 0 && !formData.extractedText) || (activeStep === 1 && !formData.jobPosting)}
          onClick={activeStep === steps.length - 1 ? handleGenerate : handleNext}
          endIcon={loading ? <CircularProgress size={20} /> : (activeStep === steps.length - 1 ? null : <ArrowForwardIcon />)}
        >
          {activeStep === steps.length - 1 ? 'Enhance Resume' : 'Next'}
        </Button>
      </Box>
    </Dialog>
  );
}

export default UploadResumeModal;
