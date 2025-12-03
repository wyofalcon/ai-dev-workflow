import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  CheckCircle as CheckIcon,
  Description as ResumeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import logo from './logo.png';

const steps = ['Choose Method', 'Enter Details', 'Review & Complete'];

function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, getIdToken, API_URL, fetchUserProfile } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [method, setMethod] = useState(null); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
    linkedinUrl: userProfile?.linkedinUrl || '',
    summary: '',
    yearsExperience: '',
    currentTitle: '',
    skills: [],
    industries: [],
  });

  // Skills input
  const [skillInput, setSkillInput] = useState('');

  // Resume text for paste option
  const [resumeText, setResumeText] = useState('');

  // File upload with react-dropzone
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError('');
    setParsing(true);

    try {
      const token = await getIdToken();
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_URL}/profile/parse-resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse resume');
      }

      // Populate form with extracted data
      populateFormFromParsedData(data.extractedData);
      setSuccess('Resume parsed successfully! Please review the extracted information.');
      setActiveStep(1);
    } catch (err) {
      console.error('Resume upload error:', err);
      setError(err.message || 'Failed to upload and parse resume');
    } finally {
      setParsing(false);
    }
  }, [getIdToken, API_URL]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const populateFormFromParsedData = (data) => {
    setFormData((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      phone: data.phone || prev.phone,
      location: data.location || prev.location,
      linkedinUrl: data.linkedinUrl || prev.linkedinUrl,
      summary: data.summary || prev.summary,
      yearsExperience: data.yearsExperience || prev.yearsExperience,
      currentTitle: data.currentTitle || prev.currentTitle,
      skills: data.skills || prev.skills,
      industries: data.industries || prev.industries,
    }));
  };

  const handleParseText = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setError('Please paste at least 50 characters of resume content');
      return;
    }

    setError('');
    setParsing(true);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/profile/parse-resume-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse resume');
      }

      populateFormFromParsedData(data.extractedData);
      setSuccess('Resume parsed successfully! Please review the extracted information.');
      setActiveStep(1);
    } catch (err) {
      console.error('Resume parse error:', err);
      setError(err.message || 'Failed to parse resume text');
    } finally {
      setParsing(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()],
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          linkedinUrl: formData.linkedinUrl,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
          careerLevel: formData.currentTitle ? 'mid' : null,
          skills: formData.skills,
          industries: formData.industries,
          completeOnboarding: true, // Mark onboarding as complete
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile');
      }

      // Refresh user profile to get updated onboardingCompleted status
      await fetchUserProfile(currentUser);

      setSuccess('Profile saved successfully!');
      
      // Navigate to home after short delay
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === 0) return;
    setActiveStep((prev) => prev - 1);
    setError('');
    setSuccess('');
  };

  const handleNext = () => {
    if (activeStep === 0 && !method) {
      setError('Please choose a method to continue');
      return;
    }
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
      setError('');
      setSuccess('');
    }
  };

  const handleSelectMethod = (selectedMethod) => {
    setMethod(selectedMethod);
    setError('');
    if (selectedMethod === 'manual') {
      setActiveStep(1);
    }
  };

  // Step 1: Choose Method
  const renderMethodSelection = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Let's Set Up Your Profile
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Upload your existing resume and we'll automatically extract your information to get you started quickly.
      </Typography>

      {/* Upload Resume - Primary Option */}
      <Card 
        elevation={method === 'upload' ? 8 : 3}
        sx={{ 
          maxWidth: 500,
          mx: 'auto',
          border: method === 'upload' ? '2px solid' : '1px solid',
          borderColor: method === 'upload' ? 'primary.main' : 'divider',
          mb: 3,
        }}
      >
        <CardActionArea 
          onClick={() => handleSelectMethod('upload')}
          sx={{ p: 3 }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Upload Your Resume
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              We'll automatically extract your contact info, skills, and experience.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="PDF" size="small" variant="outlined" />
              <Chip label="DOCX" size="small" variant="outlined" />
              <Chip label="TXT" size="small" variant="outlined" />
            </Box>
            <Chip 
              label="Recommended • Saves Time" 
              color="primary" 
              size="small" 
              sx={{ mt: 2 }}
            />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Upload Area (shown when upload is selected) */}
      {method === 'upload' && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          {/* Dropzone */}
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography>Parsing your resume...</Typography>
                <LinearProgress sx={{ mt: 2, maxWidth: 300, mx: 'auto' }} />
              </Box>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to browse (PDF, DOCX, TXT - max 5MB)
                </Typography>
              </>
            )}
          </Box>

          {/* Or paste text */}
          <Typography variant="body2" align="center" sx={{ my: 2 }}>
            — OR —
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Paste your resume content here"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Copy and paste the text content from your existing resume..."
            variant="outlined"
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleParseText}
            disabled={parsing || resumeText.length < 50}
            sx={{ mt: 2 }}
            startIcon={parsing ? <CircularProgress size={20} /> : <ResumeIcon />}
          >
            {parsing ? 'Parsing...' : 'Parse Resume Text'}
          </Button>
        </Box>
      )}

      {/* Manual Entry - Secondary Option at Bottom */}
      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Divider sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have a resume file?
          </Typography>
        </Divider>
        <Button
          variant="text"
          color="primary"
          onClick={() => handleSelectMethod('manual')}
          startIcon={<EditIcon />}
          sx={{ 
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Enter your information manually instead
        </Button>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
          You can always add or update your details later
        </Typography>
      </Box>
    </Box>
  );

  // Step 2: Enter/Edit Details
  const renderDetailsForm = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Your Professional Information
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        {method === 'upload' 
          ? 'Review and edit the information extracted from your resume.'
          : 'Enter your basic professional information.'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            placeholder="John Doe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={formData.email}
            disabled
            helperText="From your account"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="(555) 123-4567"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={handleInputChange('location')}
            placeholder="San Francisco, CA"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={handleInputChange('linkedinUrl')}
            placeholder="linkedin.com/in/johndoe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Current/Most Recent Job Title"
            value={formData.currentTitle}
            onChange={handleInputChange('currentTitle')}
            placeholder="Software Engineer"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Years of Experience"
            value={formData.yearsExperience}
            onChange={handleInputChange('yearsExperience')}
            placeholder="5"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Add Skills (press Enter to add)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={handleAddSkill}
            placeholder="Type a skill and press Enter"
          />
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<ForwardIcon />}
          disabled={!formData.fullName.trim()}
        >
          Review & Complete
        </Button>
      </Box>
    </Box>
  );

  // Step 3: Review & Complete
  const renderReview = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Review Your Profile
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Make sure everything looks correct before completing your profile setup.
      </Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">{formData.fullName || 'Not provided'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.currentTitle || 'Professional'}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography>{formData.email || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography>{formData.phone || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Location</Typography>
            <Typography>{formData.location || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">LinkedIn</Typography>
            <Typography>{formData.linkedinUrl || 'Not provided'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Years of Experience</Typography>
            <Typography>{formData.yearsExperience || 'Not provided'}</Typography>
          </Grid>
          
          {formData.skills.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Skills</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.skills.map((skill, index) => (
                  <Chip key={index} label={skill} size="small" />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        You can always update your profile information later from your account settings.
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back to Edit
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          size="large"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          py: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <img src={logo} alt="CVstomize Logo" style={{ width: '120px' }} />
        </Box>

        {/* Welcome Message */}
        <Typography variant="h4" align="center" gutterBottom>
          Welcome to CVstomize! 🎉
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Let's get you set up so you can start creating amazing, personalized resumes.
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Step Content */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {activeStep === 0 && renderMethodSelection()}
          {activeStep === 1 && renderDetailsForm()}
          {activeStep === 2 && renderReview()}
        </Paper>
      </Box>
    </Container>
  );
}

export default OnboardingPage;
