import React, { useEffect, useState } from 'react';
import ResumeDisplay from './ResumeDisplay.js';
import { Button, Container, Box } from '@mui/material';

const ResumePage = () => {
  const [generatedCv, setGeneratedCv] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Modern'); // Default style

  useEffect(() => {
    const cvData = localStorage.getItem('generatedCv');
    const style = localStorage.getItem('selectedStyle');
    if (cvData) {
      setGeneratedCv(cvData);
    }
    if (style) {
      setSelectedStyle(style);
    }
  }, []);

  const handleDownload = () => {
    window.print();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleDownload}>
          Download as PDF
        </Button>
      </Box>
      <ResumeDisplay
        title=""
        content={generatedCv}
        isLoading={false}
        selectedStyle={selectedStyle}
      />
    </Container>
  );
};

export default ResumePage;