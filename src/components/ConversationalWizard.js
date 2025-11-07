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
import { auth } from '../firebase/index.js';

/**
 * Conversational Wizard Component (FIXED - Session 18)
 *
 * Job-Description-First conversational resume builder.
 * Flow:
 * 1. Paste JD → NEW: POST /api/conversation/start with jobDescription
 * 2. Answer JD-specific questions (Gemini-generated based on actual JD)
 * 3. POST /api/conversation/message for each answer
 * 4. Complete conversation → Generate resume
 */
function ConversationalWizard({ onComplete }) {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [jobTitle, setJobTitle] = useState(null);
  const [questionsType, setQuestionsType] = useState('generic');

  const API_BASE = process.env.REACT_APP_API_URL || 'https://cvstomize-api-351889420459.us-central1.run.app';

  // Step 1: Start conversation with JD
  const startConversation = async (jd) => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log('🚀 Starting conversation with JD...');
      console.log('JD Length:', jd.length);

      const response = await fetch(`${API_BASE}/api/conversation/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobDescription: jd  // NEW: Pass JD to conversation start
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to start conversation');
      }

      console.log('✅ Conversation started:', {
        sessionId: data.sessionId,
        questionsType: data.questionsType,
        jobTitle: data.jobTitle,
        totalQuestions: data.progress.total
      });

      // Save session data
      setSessionId(data.sessionId);
      setCurrentQuestion(data.currentQuestion);
      setProgress(data.progress);
      setJobTitle(data.jobTitle);
      setQuestionsType(data.questionsType);

      // Clear the input field so user can type their answer
      setCurrentAnswer('');

    } catch (err) {
      console.error('❌ Start conversation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit answer and get next question
  const submitAnswer = async (answer) => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log('💬 Submitting answer for question:', currentQuestion.id);

      const response = await fetch(`${API_BASE}/api/conversation/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: answer,
          currentQuestionId: currentQuestion.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit answer');
      }

      console.log('✅ Answer submitted, progress:', data.progress.percentage + '%');

      // Update state
      setProgress(data.progress);
      setCurrentAnswer('');

      if (data.isComplete) {
        console.log('🎉 Conversation complete!');
        setIsComplete(true);
        await completeConversation();
      } else {
        setCurrentQuestion(data.nextQuestion);
      }

    } catch (err) {
      console.error('❌ Submit answer error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete conversation and generate resume
  const completeConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser.getIdToken();

      console.log('🏁 Completing conversation...');

      // First, complete the conversation (saves personality traits)
      const completeResponse = await fetch(`${API_BASE}/api/conversation/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeData.error || 'Failed to complete conversation');
      }

      console.log('✅ Conversation completed, personality inferred:', completeData.personality);

      // Now generate resume using conversation data
      console.log('📝 Generating resume...');

      const resumeResponse = await fetch(`${API_BASE}/api/resume/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobDescription,
          sessionId,  // Pass session ID to use conversation data
          targetCompany: jobTitle || 'Target Company',
          selectedSections: 'Summary,Experience,Skills,Education'
        })
      });

      const resumeData = await resumeResponse.json();

      if (!resumeResponse.ok) {
        throw new Error(resumeData.error || 'Resume generation failed');
      }

      console.log('✅ Resume generated:', resumeData.resumeId);

      // Call completion handler
      if (onComplete) {
        onComplete(resumeData);
      }

    } catch (err) {
      console.error('❌ Complete conversation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle next button
  const handleNext = async () => {
    if (!sessionId) {
      // First step: Start conversation with JD
      if (!currentAnswer.trim() || currentAnswer.trim().length < 50) {
        setError('Please paste a job description (minimum 50 characters)');
        return;
      }
      setJobDescription(currentAnswer);
      await startConversation(currentAnswer);
    } else {
      // Subsequent steps: Submit answer
      if (!currentAnswer.trim() || currentAnswer.trim().split(/\s+/).length < 10) {
        setError('Please provide more detail (at least 10 words)');
        return;
      }
      await submitAnswer(currentAnswer);
    }
  };

  // Render JD input step
  const renderJDInput = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Step 1: Paste the Job Description
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        I'll analyze the job requirements and ask you targeted questions about your experience.
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={12}
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        placeholder="Paste the full job description here...&#10;&#10;Example:&#10;Software Engineer - Full Stack&#10;Requirements:&#10;- 3+ years experience with React and Node.js&#10;- Strong problem-solving skills&#10;- Experience with AWS deployment&#10;..."
        variant="outlined"
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={handleNext}
        disabled={loading || !currentAnswer.trim()}
        endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
        fullWidth
      >
        {loading ? 'Analyzing Job Description...' : 'Analyze & Continue'}
      </Button>
    </Box>
  );

  // Render question step
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <Box>
        {/* Progress indicator */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Question {progress.current + 1} of {progress.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.percentage}% Complete
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        {/* Job title badge (if JD-specific questions) */}
        {jobTitle && questionsType === 'jd-specific' && (
          <Chip
            label={`Tailored for: ${jobTitle}`}
            color="primary"
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        {/* Question */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          {currentQuestion.text}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Category: {currentQuestion.category}
        </Typography>

        {/* Answer input */}
        <TextField
          fullWidth
          multiline
          rows={8}
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Share your experience in detail... (minimum 10 words)"
          variant="outlined"
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleNext}
            disabled={loading || !currentAnswer.trim()}
            endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
            fullWidth
          >
            {loading ? 'Submitting...' : progress.current === progress.total - 1 ? 'Complete & Generate Resume' : 'Next Question'}
          </Button>
        </Box>
      </Box>
    );
  };

  // Render completion message
  const renderComplete = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Profile Complete! 🎉
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generating your tailored resume...
      </Typography>
      <CircularProgress />
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4 }}>
      {!sessionId ? renderJDInput() : isComplete ? renderComplete() : renderQuestion()}
    </Paper>
  );
}

export default ConversationalWizard;
