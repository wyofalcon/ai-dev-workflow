import React, { useState } from 'react';
import { generateCv } from '../services/api';
import FileUpload from './FileUpload';
import TextInput from './TextInput';
import ResumeDisplay from './ResumeDisplay';
import SectionSelector from './SectionSelector';
import StyleSelector from './StyleSelector';
import UploadGraphic from './UploadGraphic';
import StoriesGraphic from './StoriesGraphic';
import JobDescriptionGraphic from './JobDescriptionGraphic';
import SectionsGraphic from './SectionsGraphic';
import StyleGraphic from './StyleGraphic';
import {
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import UploadFile from '@mui/icons-material/UploadFile';
import AutoStories from '@mui/icons-material/AutoStories';
import Description from '@mui/icons-material/Description';
import Tune from '@mui/icons-material/Tune';
import Palette from '@mui/icons-material/Palette';
import Article from '@mui/icons-material/Article';

const ProcessModal = ({
  isOpen,
  setIsOpen,
  cvState,
}) => {
  const {
    files, setFiles, resumeText, setResumeText, personalStories, setPersonalStories,
    jobDescription, setJobDescription, generatedCv, setGeneratedCv, isLoading,
    setIsLoading, error, setError, selectedSections, setSelectedSections,
    selectedStyle, setSelectedStyle, ALL_SECTIONS, RECOMMENDED_SECTIONS,
  } = cvState;

  const [currentStep, setCurrentStep] = useState(1);

  const handleGenerate = async () => {
    if ((files.length === 0 && !resumeText) || !jobDescription || selectedSections.length === 0) {
      setError('Please upload or paste a resume, provide a job description, and select at least one section.');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedCv('');
    setCurrentStep(6);
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('resumeText', resumeText);
    formData.append('personalStories', personalStories);
    formData.append('jobDescription', jobDescription);
    formData.append('selectedSections', selectedSections.join(','));
    try {
      const cv = await generateCv(formData);
      setGeneratedCv(cv);
    } catch (err) {
      console.error("An error occurred during CV generation:", err);
      setError("An error occurred while generating the CV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedCv) return;
    window.print();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
              <UploadGraphic />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UploadFile sx={{ mr: 1 }} />
                <Typography variant="h5">Step 1: Upload or Paste Your Resume</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Upload up to 5 of your existing resumes, cover letters, or any other relevant documents in PDF or DOCX format.
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
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
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
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
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
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
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
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
              <StyleGraphic />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Palette sx={{ mr: 1 }} />
                <Typography variant="h5">Step 5: Choose a Style</Typography>
              </Box>
              <StyleSelector
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />
            </CardContent>
          </Card>
        );
      case 6:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Article sx={{ mr: 1 }} />
                <Typography variant="h5">Your Custom-Crafted CV</Typography>
              </Box>
              <ResumeDisplay
                title=""
                content={generatedCv}
                isLoading={isLoading}
                selectedStyle={selectedStyle}
              />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '90vw', width: '800px'}}>
        <div className="modal-header">
          <h2>CVstomize Your Story</h2>
          <button className="close-button" onClick={() => setIsOpen(false)}>X</button>
        </div>
        <div className="modal-body">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {renderStep()}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            {currentStep > 1 && currentStep < 6 && (
              <Button variant="outlined" color="secondary" size="large" onClick={() => setCurrentStep(currentStep - 1)} sx={{ mr: 2 }}>
                Back
              </Button>
            )}
            {currentStep < 5 && (
              <Button variant="contained" color="primary" size="large" onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
            {currentStep === 5 && (
              <Button variant="contained" color="primary" size="large" onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : 'Generate My CV'}
              </Button>
            )}
            {currentStep === 6 && generatedCv && !isLoading && (
              <Button variant="contained" color="secondary" size="large" onClick={handleDownload}>
                Download as PDF
              </Button>
            )}
            {currentStep === 6 && (
              <Button variant="outlined" color="primary" size="large" onClick={() => { setCurrentStep(1); setGeneratedCv(''); }} sx={{ ml: 2 }}>
                Start Over
              </Button>
            )}
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </div>
      </div>
    </div>
  );
};

export default ProcessModal;