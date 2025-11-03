import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCvState } from './hooks/useCvState.js';
import HomePage from './components/HomePage.js';
import TutorialModal from './components/TutorialModal.js';
import ResumePage from './components/ResumePage.js';
import ProcessModal from './components/ProcessModal.js';
import Footer from './components/Footer.js';
import {
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Box,
} from '@mui/material';
import logo from './components/logo.png';
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
          <img src={logo} alt="logo" style={{ width: '80px', marginRight: '10px' }} />
          <Box sx={{ flexGrow: 1 }} />
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