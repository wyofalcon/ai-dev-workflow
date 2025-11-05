import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  LinearProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { auth } from '../firebase';

/**
 * Conversational Wizard Component
 *
 * Job-Description-First conversational resume builder.
 * Flow:
 * 1. Paste JD → AI analyzes
 * 2. Answer 5 JD-specific questions
 * 3. Answer 6 personality questions
 * 4. AI generates resume (zero iteration)
 */
function ConversationalWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationFlow, setConversationFlow] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

  // Step 1: Analyze JD when user submits
  const analyzeJobDescription = async (jobDescription) => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/resume/analyze-jd`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobDescription })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze job description');
      }

      console.log('✅ JD Analysis:', data.analysis);

      // Save analysis and get conversation flow
      setJdAnalysis(data);
      await getConversationFlow(data);

      // Save JD as first answer
      setAnswers({ step_1: jobDescription });
      setCurrentStep(1); // Move to first question

    } catch (err) {
      console.error('JD Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get full conversation flow (11 questions)
  const getConversationFlow = async (jdAnalysis) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/resume/conversation-flow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jdAnalysis })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get conversation flow');
      }

      console.log('✅ Conversation flow loaded:', data.totalSteps, 'steps');
      setConversationFlow(data);

    } catch (err) {
      console.error('Conversation flow error:', err);
      throw err;
    }
  };

  // Validate answer before proceeding
  const validateCurrentAnswer = async () => {
    if (currentStep === 0) return true; // JD step validated by backend

    const step = conversationFlow?.steps[currentStep];
    if (!step || !step.questionId) return true;

    // Check minimum length
    const wordCount = currentAnswer.trim().split(/\s+/).length;
    if (wordCount < (step.minWords || 20)) {
      setValidationError(`Please provide more detail (at least ${step.minWords || 20} words). You wrote ${wordCount} words.`);
      return false;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/resume/validate-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: step.questionId,
          answer: currentAnswer
        })
      });

      const data = await response.json();

      if (data.valid) {
        setValidationError(null);
        return true;
      } else {
        setValidationError(data.error);
        return false;
      }

    } catch (err) {
      console.error('Validation error:', err);
      // Don't block user on validation API failure
      return true;
    }
  };

  // Handle next button
  const handleNext = async () => {
    if (currentStep === 0) {
      // First step: Analyze JD
      if (!currentAnswer.trim()) {
        setError('Please paste a job description');
        return;
      }
      await analyzeJobDescription(currentAnswer);
      setCurrentAnswer(''); // Clear for next question
    } else {
      // Subsequent steps: Validate and save answer
      const isValid = await validateCurrentAnswer();
      if (!isValid) return;

      setAnswers({ ...answers, [`step_${currentStep}`]: currentAnswer });
      setCurrentAnswer('');
      setValidationError(null);

      // Check if we're done with questions
      if (currentStep === conversationFlow.totalSteps - 2) {
        // Last question answered - generate resume
        await generateResume();
      } else {
        // Move to next question
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Restore previous answer
      setCurrentAnswer(answers[`step_${currentStep - 1}`] || '');
      setValidationError(null);
    }
  };

  // Generate resume from conversation
  const generateResume = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      // Compile all answers into personal stories
      const allAnswers = Object.entries(answers)
        .filter(([key]) => key !== 'step_1') // Exclude JD itself
        .map(([key, answer]) => {
          const stepNum = parseInt(key.split('_')[1]);
          const step = conversationFlow.steps[stepNum];
          return `**${step?.title || 'Experience'}:**\n${answer}`;
        })
        .join('\n\n');

      const requestBody = {
        jobDescription: answers.step_1,
        personalStories: allAnswers,
        targetCompany: jdAnalysis.analysis.company || 'Target Company',
        selectedSections: 'Summary,Experience,Skills,Education',
        resumeText: '' // We're using conversation answers instead
      };

      console.log('Generating resume from conversation...');

      const response = await fetch(`${API_BASE}/api/resume/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Resume generation failed');
      }

      console.log('✅ Resume generated:', data.resumeId);

      // Call completion handler
      if (onComplete) {
        onComplete(data);
      }

    } catch (err) {
      console.error('Resume generation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const progressPercent = conversationFlow
    ? (currentStep / (conversationFlow.totalSteps - 1)) * 100
    : 0;

  // Get current step data
  const currentStepData = conversationFlow?.steps[currentStep];

  // Word count helper
  const wordCount = currentAnswer.trim().split(/\s+/).filter(w => w.length > 0).length;
  const minWords = currentStepData?.minWords || 20;
  const wordCountColor = wordCount >= minWords ? 'success' : 'warning';

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Progress Bar */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Step {currentStep + 1} of {conversationFlow?.totalSteps || 13}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progressPercent)}% Complete
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current Question */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        {currentStep === 0 ? (
          // Step 1: Job Description Input
          <>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Let's Start with the Job Description
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Paste the full job description for the position you're targeting. Our AI will analyze it
              and ask you specific questions to craft a perfectly tailored resume.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={12}
              variant="outlined"
              placeholder="Paste the complete job description here..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              Include the job title, responsibilities, required skills, and qualifications.
            </Typography>
          </>
        ) : currentStepData?.type === 'processing' ? (
          // Step 13: Processing
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {currentStepData.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {currentStepData.instruction}
            </Typography>
          </Box>
        ) : (
          // Steps 2-12: Questions
          <>
            <Chip
              label={currentStepData?.type === 'personality' ? 'Personality Insight' : 'Job-Specific'}
              color={currentStepData?.type === 'personality' ? 'secondary' : 'primary'}
              size="small"
              sx={{ mb: 2 }}
            />
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {currentStepData?.title}
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              {currentStepData?.question}
            </Typography>

            {currentStepData?.hint && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  💡 {currentStepData.hint}
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              placeholder="Share your experience with specific details and examples..."
              value={currentAnswer}
              onChange={(e) => {
                setCurrentAnswer(e.target.value);
                setValidationError(null);
              }}
              error={!!validationError}
              helperText={validationError}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color={wordCountColor}>
                {wordCount} words {wordCount < minWords && `(minimum ${minWords})`}
              </Typography>
              {currentStepData?.followUp && (
                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                  Follow-up: {currentStepData.followUp}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
        >
          Back
        </Button>

        <Button
          variant="contained"
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
          onClick={handleNext}
          disabled={loading || !currentAnswer.trim()}
          size="large"
        >
          {currentStep === 0 ? 'Analyze Job Description' :
           currentStep === conversationFlow?.totalSteps - 2 ? 'Generate My Resume' :
           'Next Question'}
        </Button>
      </Box>

      {/* Stepper (optional - for larger screens) */}
      {conversationFlow && (
        <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {conversationFlow.steps.slice(0, -1).map((step, index) => (
              <Step key={index} completed={index < currentStep}>
                <StepLabel>
                  {index === 0 ? 'JD' : index <= 5 ? `Q${index}` : index <= 11 ? `P${index - 5}` : '✓'}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
    </Box>
  );
}

export default ConversationalWizard;
