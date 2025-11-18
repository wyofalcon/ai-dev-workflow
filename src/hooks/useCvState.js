import { useState } from 'react';

const ALL_SECTIONS = [
  'Contact Information', 'Professional Summary or Objective Statement', 'Core Competencies / Key Skills',
  'Professional Experience (Work History)', 'Education', 'Certifications & Licenses', 'Major Projects or Portfolio Highlights',
  'Technical Skills (Tools, Technologies, Platforms)', 'Research Experience (Academic/Industry)', 'Publications & Presentations',
  'Awards & Honors', 'Professional Affiliations & Memberships', 'Volunteer Experience & Community Involvement',
  'Conferences, Workshops & Continuing Education', 'Patents & Intellectual Property', 'Language Proficiency',
  'Leadership & Extracurricular Activities', 'Interests & Hobbies (if relevant to role or culture)',
  'References (Available Upon Request)', 'Additional Information (Security Clearances, Visa Status, etc.)'
];

const RECOMMENDED_SECTIONS = [
  'Contact Information', 'Professional Summary or Objective Statement', 'Core Competencies / Key Skills',
  'Professional Experience (Work History)', 'Education'
];

export const useCvState = () => {
  const [files, setFiles] = useState([]);
  const [resumeText, setResumeText] = useState(''); // Add this line
  const [personalStories, setPersonalStories] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generatedCv, setGeneratedCv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSections, setSelectedSections] = useState(RECOMMENDED_SECTIONS);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return {
    files,
    setFiles,
    resumeText, // Add this line
    setResumeText, // Add this line
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
    ALL_SECTIONS,
    RECOMMENDED_SECTIONS,
  };
};
