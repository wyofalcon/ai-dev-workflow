import React, { useState } from 'react';
import { useCvState } from './hooks/useCvState';
import HomePage from './components/HomePage';
import ProcessModal from './components/ProcessModal';
import TutorialModal from './components/TutorialModal';
import {
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
} from '@mui/material';
import './App.css';

function App() {
  const cvState = useCvState();
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const { isTutorialOpen, setIsTutorialOpen } = cvState;

  return (
    <div className="App">
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
        <HomePage onStart={() => setIsProcessModalOpen(true)} />
        {isTutorialOpen && <TutorialModal setIsOpen={setIsTutorialOpen} />}
        <ProcessModal
          isOpen={isProcessModalOpen}
          setIsOpen={setIsProcessModalOpen}
          cvState={cvState}
        />
      </Container>
    </div>
  );
}

export default App;
