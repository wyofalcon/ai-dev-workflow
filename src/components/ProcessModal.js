
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import FileUpload from './FileUpload';
import TextInput from './TextInput';
import SectionSelector from './SectionSelector';
import StyleSelector from './StyleSelector';
import UploadGraphic from './UploadGraphic';
import StoriesGraphic from './StoriesGraphic';
import JobDescriptionGraphic from './JobDescriptionGraphic';
import SectionsGraphic from './SectionsGraphic';
import StyleGraphic from './StyleGraphic';
import UploadFile from '@mui/icons-material/UploadFile';
import AutoStories from '@mui/icons-material/AutoStories';
import Description from '@mui/icons-material/Description';
import Tune from '@mui/icons-material/Tune';
import Palette from '@mui/icons-material/Palette';
import { generateCv } from '../services/api';

const steps = ['Upload Resume', 'Add Personal Stories', 'Job Description', 'Customize Sections', 'Choose Style'];

export default function ProcessModal({ open, handleClose, cvState }) {
  const {
    files, setFiles, resumeText, setResumeText, personalStories, setPersonalStories,
    jobDescription, setJobDescription, setGeneratedCv, isLoading,
    setIsLoading, error, setError, selectedSections, setSelectedSections,
    selectedStyle, setSelectedStyle, ALL_SECTIONS, RECOMMENDED_SECTIONS
  } = cvState;

  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    setCurrentStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerate = async () => {
    if ((files.length === 0 && !resumeText) || !jobDescription || selectedSections.length === 0) {
      setError('Please upload or paste a resume, provide a job description, and select at least one section.');
      return;
    }
    setIsLoading(true);
    setError('');
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('resumeText', resumeText);
    formData.append('personalStories', personalStories);
    formData.append('jobDescription', jobDescription);
    formData.append('selectedSections', selectedSections.join(','));
    try {
      const cv = await generateCv(formData);
      setGeneratedCv(cv);
      localStorage.setItem('generatedCv', cv);
      localStorage.setItem('selectedStyle', selectedStyle);
      window.open('/resume', '_blank');
      handleClose();
    } catch (err) {
      console.error("An error occurred during CV generation:", err);
      setError("An error occurred while generating the CV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <UploadGraphic />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UploadFile sx={{ mr: 1 }} />
              <Typography variant="h5">Step 1: Upload or Paste Your Resume</Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
              Upload up to 5 of your existing resumes, cover letters, or any other relevant documents in DOCX format.
            </Typography>
            <FileUpload files={files} setFiles={setFiles} />
            <Typography variant="h6" sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
              OR
            </Typography>
            <TextInput
              title="Paste Your Resume"
              placeholder="Paste your entire resume here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </>
        );
      case 1:
        return (
          <>
            <StoriesGraphic />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AutoStories sx={{ mr: 1 }} />
              <Typography variant="h5">Step 2: Add Personal Stories</Typography>
            </Box>
            <TextInput
              title="This is your secret weapon!"
              placeholder="Tell me a story about a time you solved a problem, learned a new skill, or accomplished something you're proud of..."
              value={personalStories}
              onChange={(e) => setPersonalStories(e.target.value)}
            />
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Share stories about your projects, hobbies, or even that time you won a silly game. Our AI will find the hidden skills that make you stand out.
            </Typography>
          </>
        );
      case 2:
        return (
          <>
            <JobDescriptionGraphic />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Description sx={{ mr: 1 }} />
              <Typography variant="h5">Step 3: Paste the Job Description</Typography>
            </Box>
            <TextInput
              title=""
              placeholder="Paste the entire job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </>
        );
      case 3:
        return (
          <>
            <SectionsGraphic />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Tune sx={{ mr: 1 }} />
              <Typography variant="h5">Step 4: Customize Your CV Sections</Typography>
            </Box>
            <SectionSelector
              allSections={ALL_SECTIONS}
              recommendedSections={RECOMMENDED_SECTIONS}
              selectedSections={selectedSections}
              setSelectedSections={setSelectedSections}
            />
          </>
        );
      case 4:
        return (
          <>
            <StyleGraphic />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Palette sx={{ mr: 1 }} />
              <Typography variant="h5">Step 5: Choose a Style</Typography>
            </Box>
            <StyleSelector
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
            />
          </>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { bgcolor: '#1e1e1e' } }}>
      <DialogTitle>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {renderStepContent(currentStep)}
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button disabled={currentStep === 0} onClick={handleBack}>
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {currentStep === steps.length - 1 ? (
          <Button onClick={handleGenerate} variant="contained" color="primary" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Generate My CV'}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="primary">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
