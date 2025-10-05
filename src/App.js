import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCvState } from './hooks/useCvState';
import HomePage from './components/HomePage';
import TutorialModal from './components/TutorialModal';
import ResumePage from './components/ResumePage';
import ProcessModal from './components/ProcessModal';
import import Footer from './components/Footer';
import {
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Box,
} from '@mui/material';
import './App.css';

function MainLayout() {
  const cvState = useCvState();
  const { isTutorialOpen, setIsTutorialOpen } = cvState;

  const [isProcessStarted, setIsProcessStarted] = useState(false);

  const handleStart = () => {
    setIsProcessStarted(true);
  };

  const handleClose = () => {
    setIsProcessStarted(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
          <ProcessModal open={isProcessStarted} handleClose={handleClose} cvState={cvState} />
        )}
      </Container>
      <Footer />
    </Box>
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