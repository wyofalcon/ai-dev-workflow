import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Psychology as BrainIcon,
  EmojiObjects as InsightIcon,
} from "@mui/icons-material";

const SECTIONS = ["Stories", "Personality Items", "Final Questions"];

// Question data (imported from backend structure)
const STORY_QUESTIONS = [
  {
    id: 1,
    type: "achievement",
    emoji: "🎯",
    question:
      "Tell me about your proudest professional or academic achievement.",
    prompt: "What made it challenging, and how did you accomplish it?",
    placeholder: "Describe the situation, what you did, and the outcome...",
    minWords: 50,
  },
  {
    id: 2,
    type: "adversity",
    emoji: "🌊",
    question: "Describe a time when something important didn't go as planned.",
    prompt: "What happened, how did you feel, and what did you do?",
    placeholder: "Share what went wrong and how you handled it...",
    minWords: 50,
  },
  {
    id: 3,
    type: "team",
    emoji: "👥",
    question: "Tell me about a memorable team experience.",
    prompt: "What was your role, and what did you contribute?",
    placeholder: "Describe the team, your role, and what you contributed...",
    minWords: 50,
  },
  {
    id: 4,
    type: "innovation",
    emoji: "💡",
    question:
      "Think of a time you approached a problem differently than others.",
    prompt: "What was your solution, and what happened?",
    placeholder: "Explain the problem and your unique approach...",
    minWords: 50,
  },
  {
    id: 5,
    type: "helping",
    emoji: "🤝",
    question:
      "Describe a situation where you went out of your way to help someone.",
    prompt: "What motivated you, and what was the outcome?",
    placeholder: "Share who you helped and why it mattered...",
    minWords: 50,
  },
  {
    id: 6,
    type: "learning",
    emoji: "📚",
    question: "What's a skill you taught yourself?",
    prompt: "Why did you learn it, and how did you go about it?",
    placeholder: "Describe what you learned and your learning process...",
    minWords: 50,
  },
  {
    id: 7,
    type: "values",
    emoji: "⚖️",
    question: "Tell me about a time you had to make a difficult decision.",
    prompt: "What factors did you consider, and what did you choose?",
    placeholder: "Explain the decision and your thought process...",
    minWords: 50,
  },
  {
    id: 8,
    type: "passion",
    emoji: "🔥",
    question: "What are you genuinely passionate about?",
    prompt: "This can be work-related or not. What draws you to it?",
    placeholder: "Share what excites you and why...",
    minWords: 50,
  },
];

const LIKERT_QUESTIONS = [
  // Openness
  { id: "q1", text: "...is original, comes up with new ideas" },
  { id: "q2", text: "...is curious about many different things" },
  { id: "q3", text: "...prefers work that is routine" },
  { id: "q4", text: "...is inventive" },
  // Conscientiousness
  { id: "q5", text: "...does a thorough job" },
  { id: "q6", text: "...tends to be disorganized" },
  { id: "q7", text: "...is a reliable worker" },
  { id: "q8", text: "...perseveres until the task is finished" },
  // Extraversion
  { id: "q9", text: "...is talkative" },
  { id: "q10", text: "...is reserved" },
  { id: "q11", text: "...is outgoing, sociable" },
  { id: "q12", text: "...generates a lot of enthusiasm" },
  // Agreeableness
  { id: "q13", text: "...is helpful and unselfish with others" },
  { id: "q14", text: "...can be cold and aloof" },
  { id: "q15", text: "...is considerate and kind to almost everyone" },
  { id: "q16", text: "...likes to cooperate with others" },
  // Neuroticism
  { id: "q17", text: "...worries a lot" },
  { id: "q18", text: "...is relaxed, handles stress well" },
  { id: "q19", text: "...gets nervous easily" },
  { id: "q20", text: "...remains calm in tense situations" },
];

const HYBRID_QUESTIONS = [
  {
    id: 1,
    type: "work_environment",
    emoji: "🏢",
    question: "Describe your ideal work environment.",
    prompt: "What helps you perform at your best?",
    placeholder: "Think about physical space, team dynamics, work style...",
    minWords: 30,
  },
  {
    id: 2,
    type: "project_management",
    emoji: "📋",
    question:
      "Walk me through how you typically approach a new project or goal.",
    prompt: "What's your process from start to finish?",
    placeholder: "Describe your workflow and planning approach...",
    minWords: 30,
  },
  {
    id: 3,
    type: "stress_response",
    emoji: "😰",
    question: "Think of the last time you felt overwhelmed.",
    prompt: "What triggered it, and how did you handle it?",
    placeholder: "Share what happened and your coping strategy...",
    minWords: 30,
  },
  {
    id: 4,
    type: "curiosity",
    emoji: "💡",
    question:
      "What's the last thing you learned just because it interested you?",
    prompt: "What about it caught your attention?",
    placeholder: "Describe what you learned and why...",
    minWords: 30,
  },
  {
    id: 5,
    type: "conflict_style",
    emoji: "💬",
    question: "Describe a time you disagreed with someone important.",
    prompt: "How did you handle it?",
    placeholder: "Explain the disagreement and how you navigated it...",
    minWords: 30,
  },
  {
    id: 6,
    type: "change_tolerance",
    emoji: "🔄",
    question: "Tell me about a major change you experienced.",
    prompt: "How did you adapt?",
    placeholder: "Share the change and how you handled it...",
    minWords: 30,
  },
  {
    id: 7,
    type: "motivation",
    emoji: "🚀",
    question: "What drives you to do your best work?",
    prompt: "What gets you out of bed excited?",
    placeholder: "Describe what motivates you...",
    minWords: 30,
  },
];

function GoldStandardWizard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, getIdToken, API_URL } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // Section A: Stories
  const [stories, setStories] = useState({});
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Section B: Likert
  const [likertResponses, setLikertResponses] = useState({});

  // Section C: Hybrid
  const [hybridAnswers, setHybridAnswers] = useState({});
  const [currentHybridIndex, setCurrentHybridIndex] = useState(0);

  // Results
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check Gold access on mount
  useEffect(() => {
    if (
      userProfile?.subscriptionTier &&
      !["gold", "platinum", "enterprise"].includes(userProfile.subscriptionTier)
    ) {
      setError(
        "Gold Standard assessment requires a Gold subscription or higher."
      );
    }
  }, [userProfile]);

  // Check for existing completed profile on mount
  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!userProfile) {
        setCheckingProfile(false);
        return;
      }

      setCheckingProfile(true);

      try {
        const token = await getIdToken();
        const response = await fetch(`${API_URL}/gold-standard/start`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.status === "already_complete") {
          // Profile already exists - skip to results
          console.log(
            "Gold Standard profile already complete, loading results..."
          );
          fetchResults();
        }
      } catch (err) {
        // If check fails, user can still click "Start Assessment" button
        console.error("Failed to check profile status:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileStatus();
  }, [userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const startAssessment = async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/gold-standard/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start assessment");
      }

      if (data.status === "already_complete") {
        // Show existing results
        fetchResults();
      } else {
        setSessionId(data.profileId);
        setActiveStep(0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveStory = async (story) => {
    const newStories = { ...stories, [story.type]: story.storyText };
    setStories(newStories);

    try {
      const token = await getIdToken();
      await fetch(`${API_URL}/gold-standard/answer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "stories",
          answers: [
            {
              questionType: story.type,
              questionText: story.questionText,
              storyText: story.storyText,
            },
          ],
        }),
      });
    } catch (err) {
      console.error("Error saving story:", err);
    }
  };

  const saveLikertAnswers = async () => {
    setLoading(true);

    try {
      const token = await getIdToken();
      await fetch(`${API_URL}/gold-standard/answer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "likert",
          answers: likertResponses,
        }),
      });

      setActiveStep(2);
    } catch (err) {
      setError("Failed to save personality responses");
    } finally {
      setLoading(false);
    }
  };

  const saveHybrid = async (answer) => {
    const newAnswers = { ...hybridAnswers, [answer.type]: answer.answerText };
    setHybridAnswers(newAnswers);

    try {
      const token = await getIdToken();
      await fetch(`${API_URL}/gold-standard/answer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "hybrid",
          answers: [
            {
              questionType: answer.type,
              questionText: answer.questionText,
              answer: answer.answerText,
            },
          ],
        }),
      });
    } catch (err) {
      console.error("Error saving hybrid answer:", err);
    }
  };

  const completeAssessment = async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/gold-standard/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete assessment");
      }

      setResults(data.results);
      setShowResults(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/gold-standard/results`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setShowResults(true);
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };

  // Render Section A: Stories
  const renderStoryQuestion = () => {
    const question = STORY_QUESTIONS[currentStoryIndex];
    const currentStory = stories[question.type] || "";
    const wordCount = currentStory.trim().split(/\s+/).filter(Boolean).length;

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {question.emoji} {question.question}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {question.prompt}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          id={`story-${question.type}`}
          name={`story-${question.type}`}
          placeholder={question.placeholder}
          value={currentStory}
          onChange={(e) =>
            setStories({ ...stories, [question.type]: e.target.value })
          }
          sx={{ mb: 2 }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            color={
              wordCount >= question.minWords ? "success.main" : "text.secondary"
            }
          >
            {wordCount} words (minimum {question.minWords})
          </Typography>

          <Box>
            <Button
              disabled={currentStoryIndex === 0}
              onClick={() => setCurrentStoryIndex(currentStoryIndex - 1)}
              startIcon={<BackIcon />}
            >
              Previous
            </Button>
            <Button
              disabled={wordCount < question.minWords}
              onClick={() => {
                saveStory({
                  type: question.type,
                  questionText: question.question,
                  storyText: currentStory,
                });

                if (currentStoryIndex < STORY_QUESTIONS.length - 1) {
                  setCurrentStoryIndex(currentStoryIndex + 1);
                } else {
                  setActiveStep(1);
                }
              }}
              endIcon={
                currentStoryIndex === STORY_QUESTIONS.length - 1 ? (
                  <CheckIcon />
                ) : (
                  <ForwardIcon />
                )
              }
              variant="contained"
            >
              {currentStoryIndex === STORY_QUESTIONS.length - 1
                ? "Continue to Personality Items"
                : "Next"}
            </Button>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={((currentStoryIndex + 1) / STORY_QUESTIONS.length) * 100}
          sx={{ mt: 2 }}
        />
      </Box>
    );
  };

  // Render Section B: Likert
  const renderLikertQuestions = () => {
    const allAnswered = LIKERT_QUESTIONS.every((q) => likertResponses[q.id]);

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Personality Assessment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          "I see myself as someone who..." Rate each statement from 1 (Disagree
          Strongly) to 5 (Agree Strongly)
        </Typography>

        <Grid container spacing={2}>
          {LIKERT_QUESTIONS.map((question) => (
            <Grid item xs={12} key={question.id}>
              <Paper sx={{ p: 2 }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    {question.text}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={likertResponses[question.id] || ""}
                    onChange={(e) =>
                      setLikertResponses({
                        ...likertResponses,
                        [question.id]: parseInt(e.target.value),
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <FormControlLabel
                        key={value}
                        value={value}
                        control={<Radio />}
                        label={value}
                        labelPlacement="top"
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button onClick={() => setActiveStep(0)} startIcon={<BackIcon />}>
            Back to Stories
          </Button>
          <Button
            disabled={!allAnswered}
            onClick={saveLikertAnswers}
            endIcon={<ForwardIcon />}
            variant="contained"
          >
            Continue to Final Questions
          </Button>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(Object.keys(likertResponses).length / 20) * 100}
          sx={{ mt: 2 }}
        />
      </Box>
    );
  };

  // Render Section C: Hybrid
  const renderHybridQuestion = () => {
    const question = HYBRID_QUESTIONS[currentHybridIndex];
    const currentAnswer = hybridAnswers[question.type] || "";
    const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length;

    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {question.emoji} {question.question}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {question.prompt}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder={question.placeholder}
          value={currentAnswer}
          onChange={(e) =>
            setHybridAnswers({
              ...hybridAnswers,
              [question.type]: e.target.value,
            })
          }
          sx={{ mb: 2 }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            color={
              wordCount >= question.minWords ? "success.main" : "text.secondary"
            }
          >
            {wordCount} words (minimum {question.minWords})
          </Typography>

          <Box>
            <Button
              disabled={currentHybridIndex === 0}
              onClick={() => setCurrentHybridIndex(currentHybridIndex - 1)}
              startIcon={<BackIcon />}
            >
              Previous
            </Button>
            <Button
              disabled={wordCount < question.minWords}
              onClick={() => {
                saveHybrid({
                  type: question.type,
                  questionText: question.question,
                  answerText: currentAnswer,
                });

                if (currentHybridIndex < HYBRID_QUESTIONS.length - 1) {
                  setCurrentHybridIndex(currentHybridIndex + 1);
                } else {
                  completeAssessment();
                }
              }}
              endIcon={
                currentHybridIndex === HYBRID_QUESTIONS.length - 1 ? (
                  <CheckIcon />
                ) : (
                  <ForwardIcon />
                )
              }
              variant="contained"
            >
              {currentHybridIndex === HYBRID_QUESTIONS.length - 1
                ? "Complete Assessment"
                : "Next"}
            </Button>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={((currentHybridIndex + 1) / HYBRID_QUESTIONS.length) * 100}
          sx={{ mt: 2 }}
        />
      </Box>
    );
  };

  // Render Results
  const renderResults = () => {
    if (!results) return null;

    const { ocean, derived, confidence, summary, insights } = results;

    return (
      <Dialog open={showResults} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BrainIcon color="primary" />
            <Typography variant="h5">
              Your Gold Standard Personality Profile
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Assessment Complete! Confidence: {(confidence * 100).toFixed(0)}%
          </Alert>

          <Typography variant="h6" gutterBottom>
            OCEAN Scores
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(ocean).map(([trait, score]) => (
              <Grid item xs={6} sm={4} key={trait}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      textTransform="capitalize"
                    >
                      {trait}
                    </Typography>
                    <Typography variant="h4">{score}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Work Style Insights
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            <Chip label={`Work Style: ${derived.workStyle}`} color="primary" />
            <Chip
              label={`Communication: ${derived.communicationStyle}`}
              color="secondary"
            />
            <Chip label={`Leadership: ${derived.leadershipStyle}`} />
            <Chip label={`Motivation: ${derived.motivationType}`} />
          </Box>

          {summary && (
            <>
              <Typography variant="h6" gutterBottom>
                Profile Summary
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {summary}
              </Typography>
            </>
          )}

          {insights && insights.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Key Insights
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {insights.map((insight, i) => (
                  <Typography
                    component="li"
                    key={i}
                    variant="body2"
                    sx={{ mb: 1 }}
                  >
                    {insight}
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
          <Button variant="contained" onClick={() => navigate("/profile")}>
            View Full Profile
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!sessionId && !showResults) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <StarIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Gold Standard Personality Assessment
          </Typography>

          {checkingProfile ? (
            <>
              <CircularProgress sx={{ my: 3 }} />
              <Typography variant="body1" color="text.secondary">
                Checking your profile status...
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Get 90%+ accurate insights into your personality with our
                scientifically validated assessment. This takes 20-25 minutes
                and unlocks premium features.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={startAssessment}
                disabled={loading || error}
              >
                {loading ? <CircularProgress size={24} /> : "Start Assessment"}
              </Button>
            </>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      data-testid="gold-standard-page"
      maxWidth="lg"
      sx={{ mt: 4, mb: 4 }}
    >
      <Paper data-testid="gold-standard-content" sx={{ p: 4 }}>
        <Stepper
          data-testid="gold-standard-stepper"
          activeStep={activeStep}
          sx={{ mb: 4 }}
        >
          {SECTIONS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {activeStep === 0 && renderStoryQuestion()}
        {activeStep === 1 && renderLikertQuestions()}
        {activeStep === 2 && renderHybridQuestion()}
      </Paper>

      {renderResults()}
    </Container>
  );
}

export default GoldStandardWizard;
