
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
import FileUpload from './FileUpload.js';
import TextInput from './TextInput.js';
import SectionSelector from './SectionSelector.js';
import UploadGraphic from './UploadGraphic.js';
import StoriesGraphic from './StoriesGraphic.js';
import JobDescriptionGraphic from './JobDescriptionGraphic.js';
import SectionsGraphic from './SectionsGraphic.js';
import StepHeader from './StepHeader.js';
import UploadFile from '@mui/icons-material/UploadFile';
import AutoStories from '@mui/icons-material/AutoStories';
import Description from '@mui/icons-material/Description';
import Tune from '@mui/icons-material/Tune';
import { generateCv } from '../services/api.js';

const steps = ['Your Secret Weapon', 'Upload Resume', 'Job Description', 'Customize Sections'];

export default function ProcessModal({ open, handleClose, cvState }) {
  const {
    files, setFiles, resumeText, setResumeText, personalStories, setPersonalStories,
    jobDescription, setJobDescription, setGeneratedCv, isLoading,
    setIsLoading, error, setError, selectedSections, setSelectedSections,
    ALL_SECTIONS, RECOMMENDED_SECTIONS
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
      const pdfBlob = await generateCv(formData);
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
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
            <StepHeader graphic={<StoriesGraphic />} icon={<AutoStories sx={{ mr: 1 }} />} title="Step 1: Unleash Your Secret Weapon" />
            <TextInput
              title="Tell Us Your Stories. We'll Find Your Strengths."
              placeholder="Tell me a story about a time you solved a complex problem, learned a new skill, led a team, or even a hobby you're passionate about..."
              value={personalStories}
              onChange={(e) => setPersonalStories(e.target.value)}
            />
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              This is what makes CVstomize different. Your work experience is only half the story. Share stories about your projects, hobbies, or even that time you won a silly game. Our AI will find the hidden skills that make you the perfect candidate.
            </Typography>
          </>
        );
      case 1:
        return (
          <>
            <StepHeader graphic={<UploadGraphic />} icon={<UploadFile sx={{ mr: 1 }} />} title="Step 2: Add Your Experience" />
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
      case 2:
        return (
          <>
            <StepHeader graphic={<JobDescriptionGraphic />} icon={<Description sx={{ mr: 1 }} />} title="Step 3: Paste the Job Description" />
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
            <StepHeader graphic={<SectionsGraphic />} icon={<Tune sx={{ mr: 1 }} />} title="Step 4: Customize Your CV Sections" />
            <SectionSelector
              allSections={ALL_SECTIONS}
              recommendedSections={RECOMMENDED_SECTIONS}
              selectedSections={selectedSections}
              setSelectedSections={setSelectedSections}
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
