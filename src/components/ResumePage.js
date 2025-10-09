


import React, { useEffect, useState } from 'react';

import ResumeGenerator from './ResumeGenerator.js';

import { Container } from '@mui/material';



const parseCvData = (markdown) => {

  const lines = markdown.split('\n');

  const data = { experience: [] };

  let currentSection = null;

  let currentExperience = null;



  lines.forEach(line => {

    if (line.startsWith('# ')) {

      data.name = line.substring(2);

    } else if (!data.email && (line.includes('@') || line.toLowerCase().includes('email'))) {

        data.email = line;

    } else if (!data.phone && (line.match(/\d{3}-\d{3}-\d{4}/) || line.toLowerCase().includes('phone'))) {

        data.phone = line;

    } else if (line.startsWith('## ')) {

      currentSection = line.substring(3).toLowerCase();

      if (currentSection === 'experience') {

        // Handled by H3

      } else {

        data[currentSection] = [];

      }

    } else if (line.startsWith('### ')) {

      if (currentSection === 'experience') {

        if (currentExperience) {

          data.experience.push(currentExperience);

        }

        currentExperience = { title: line.substring(4), description: [] };

      }

    } else if (line.startsWith('-')){

        if(currentExperience) {

            currentExperience.description.push(line.substring(1));

        }

    }

    

    else if (currentExperience && !currentExperience.company) {

      currentExperience.company = line;

    }

  });



  if (currentExperience) {

    data.experience.push(currentExperience);

  }



  return data;

};



const ResumePage = () => {

  const [cvData, setCvData] = useState(null);



  useEffect(() => {

    const storedCvData = localStorage.getItem('generatedCv');

    if (storedCvData) {

      try {

        const parsedCvData = parseCvData(storedCvData);

        setCvData(parsedCvData);

      } catch (error) {

        console.error('Error parsing CV data:', error);

        // Handle error, maybe show a message to the user

      }

    }

  }, []);



  return (

    <Container maxWidth="lg" sx={{ mt: 4 }}>

      {cvData ? (

        <ResumeGenerator cvData={cvData} />

      ) : (

        <p>Loading resume data...</p>

      )}

    </Container>

  );

};



export default ResumePage;
