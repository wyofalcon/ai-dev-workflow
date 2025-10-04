import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCvState } from './hooks/useCvState';
import HomePage from './components/HomePage';
import TutorialModal from './components/TutorialModal';
import ResumePage from './components/ResumePage';
import { generateCv } from './services/api';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import SectionSelector from './components/SectionSelector';
import StyleSelector from './components/StyleSelector';
import UploadGraphic from './components/UploadGraphic';
import StoriesGraphic from './components/StoriesGraphic';
import JobDescriptionGraphic from './components/JobDescriptionGraphic';
import SectionsGraphic from './components/SectionsGraphic';
import StyleGraphic from './components/StyleGraphic';
import {
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
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
import './App.css';

function MainLayout() {
  const cvState = useCvState();
  const {
    files, setFiles, resumeText, setResumeText, personalStories, setPersonalStories,
    jobDescription, setJobDescription, generatedCv, setGeneratedCv, isLoading,
    setIsLoading, error, setError, selectedSections, setSelectedSections,
    selectedStyle, setSelectedStyle, ALL_SECTIONS, RECOMMENDED_SECTIONS,
    isTutorialOpen, setIsTutorialOpen
  } = cvState;

  const [isProcessStarted, setIsProcessStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleStart = () => {
    setIsProcessStarted(true);
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
    } catch (err) {
      console.error("An error occurred during CV generation:", err);
      setError("An error occurred while generating the CV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px', mt: 4 }}>
            <CardContent>
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
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px', mt: 4 }}>
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
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px', mt: 4 }}>
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
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px', mt: 4 }}>
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
          <Card sx={{ backgroundColor: '#1e1e1e', maxWidth: '700px', mt: 4 }}>
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
      default:
        return null;
    }
  };

  return (
    <div>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#9d99e5' }}>
            CVstomize
          </Typography>
          <Button color="primary" onClick={() => setIsTutorialOpen(true)}>
            How to Use
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <HomePage onStart={handleStart} />
        {isTutorialOpen && <TutorialModal setIsOpen={setIsTutorialOpen} />}
        {isProcessStarted && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {renderStep()}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              {currentStep > 1 && (
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
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        )}
      </Container>
    </div>
  );
}


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/resume" element={<ResumePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;