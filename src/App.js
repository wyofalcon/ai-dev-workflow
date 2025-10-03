import React, { useState } from 'react';
import { generateCv } from './services/api';
import { useCvState } from './hooks/useCvState';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import ResumeDisplay from './components/ResumeDisplay';
import SectionSelector from './components/SectionSelector';
import TutorialModal from './components/TutorialModal';
import StyleSelector from './components/StyleSelector';
import HomePage from './components/HomePage';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Box,
} from '@mui/material';
import UploadFile from '@mui/icons-material/UploadFile';
import AutoStories from '@mui/icons-material/AutoStories';
import Description from '@mui/icons-material/Description';
import Tune from '@mui/icons-material/Tune';
import Palette from '@mui/icons-material/Palette';
import Article from '@mui/icons-material/Article';
import './App.css';

function App() {
  const {
    files,
    setFiles,
    personalStories,
    setPersonalStories,
    jobDescription,
    setJobDescription,
    generatedCv,
    setGeneratedCv,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedSections,
    setSelectedSections,
    isTutorialOpen,
    setIsTutorialOpen,
    selectedStyle,
    setSelectedStyle,
    ALL_SECTIONS,
    RECOMMENDED_SECTIONS,
  } = useCvState();

  const [currentStep, setCurrentStep] = useState(0);

  const handleGenerate = async () => {
    if (files.length === 0 || !jobDescription || selectedSections.length === 0) {
      setError('Please upload a document, provide a job description, and select at least one section.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedCv('');
    setCurrentStep(6);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
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
      case 0:
        return <HomePage onStart={() => setCurrentStep(1)} />;
      case 1:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UploadFile sx={{ mr: 1 }} />
                <Typography variant="h5">Step 1: Upload Your Resume</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Upload your existing resume in PDF or DOCX format. This will be used as the basis for your new, tailored CV.
              </Typography>
              <FileUpload files={files} setFiles={setFiles} />
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AutoStories sx={{ mr: 1 }} />
                <Typography variant="h5">Step 2: Add Personal Stories</Typography>
              </Box>
              <TextInput
                title="This is your secret weapon!"
                placeholder="Tell me a story about a time you solved a problem, learned a new skill, or accomplished something you're proud of. For example, 'I once won a game by moving an Oreo from my forehead to my mouth without using my hands. It taught me creative problem-solving and perseverance!'"
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
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description sx={{ mr: 1 }} />
                <Typography variant="h5">Step 3: Paste the Job Description</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Paste the entire job description for the role you're applying for. Our AI will analyze it to identify the key skills and keywords to include in your CV.
              </Typography>
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
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Tune sx={{ mr: 1 }} />
                <Typography variant="h5">Step 4: Customize Your CV Sections</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Select the sections you want to include in your generated CV. We've recommended some based on common practices.
              </Typography>
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
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Palette sx={{ mr: 1 }} />
                <Typography variant="h5">Step 5: Choose a Style</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Select a visual style for your CV.
              </Typography>
              <StyleSelector
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />
            </CardContent>
          </Card>
        );
      case 6:
        return (
          <Card sx={{ backgroundColor: '#1e1e1e' }}>
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
        return <HomePage onStart={() => setCurrentStep(1)} />;
    }
  };

  return (
    <div className="App">
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#9d99e5', cursor: 'pointer' }} onClick={() => setCurrentStep(0)}>
            CVstomize
          </Typography>
          <Button color="primary" onClick={() => setIsTutorialOpen(true)}>
            How to Use
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {isTutorialOpen && <TutorialModal setIsOpen={setIsTutorialOpen} />}

        {currentStep > 0 && currentStep < 6 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Let's Build Your CV
            </Typography>
          </Box>
        )}

        {renderStep()}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          {currentStep > 0 && currentStep < 6 && (
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => setCurrentStep(currentStep - 1)}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
          )}
          {currentStep > 0 && currentStep < 5 && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
            </Button>
          )}
          {currentStep === 5 && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Generate My CV'}
            </Button>
          )}
          {currentStep === 6 && generatedCv && !isLoading && (
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={handleDownload}
            >
              Download as PDF
            </Button>
          )}
           {currentStep === 6 && (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => setCurrentStep(0)}
              sx={{ ml: 2 }}
            >
              Start Over
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Container>
    </div>
  );
}

export default App;
