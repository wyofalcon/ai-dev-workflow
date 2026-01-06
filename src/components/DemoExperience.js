import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  LinearProgress,
  Chip,
  Fade,
  Slide,
  IconButton,
} from "@mui/material";
import {
  AutoAwesome as SparkleIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import logo from "./logo.png";

// Demo questions that showcase the story-driven approach
const DEMO_QUESTIONS = [
  {
    id: 1,
    question:
      "Tell me about a time you solved a problem that others couldn't figure out. It doesn't have to be work-related — maybe fixing something at home, helping a friend, or a personal project.",
    placeholder:
      "For example: I once fixed our family's broken WiFi when the tech support couldn't help...",
    skillsToDiscover: [
      "Problem Solving",
      "Technical Troubleshooting",
      "Persistence",
    ],
    category: "Problem Solving",
  },
  {
    id: 2,
    question:
      "What's something you've taught yourself — a skill, hobby, or knowledge area — completely outside of school or work requirements?",
    placeholder:
      "For example: I taught myself photography by watching YouTube tutorials and practicing every weekend...",
    skillsToDiscover: ["Self-Directed Learning", "Initiative", "Dedication"],
    category: "Self-Learning",
  },
  {
    id: 3,
    question:
      "Describe a time you helped organize or lead something — even informally. This could be a family event, a group project with friends, or a community activity.",
    placeholder:
      "For example: I organized our neighborhood's annual block party for the past 3 years...",
    skillsToDiscover: [
      "Leadership",
      "Organization",
      "Event Planning",
      "Communication",
    ],
    category: "Leadership",
  },
  {
    id: 4,
    question:
      "What's a project you're genuinely proud of that wasn't for a job or school? Why does it matter to you?",
    placeholder:
      "For example: I built a custom computer for my little brother to help him learn programming...",
    skillsToDiscover: [
      "Project Management",
      "Creativity",
      "Technical Skills",
      "Mentoring",
    ],
    category: "Personal Projects",
  },
];

function DemoExperience() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [discoveredSkills, setDiscoveredSkills] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);

  const progress = (currentQuestion / DEMO_QUESTIONS.length) * 100;

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;

    // Save answer
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: currentAnswer,
    }));

    // Simulate AI analysis
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      setShowAnalysis(true);

      // Add discovered skills
      const newSkills = DEMO_QUESTIONS[currentQuestion].skillsToDiscover;
      setDiscoveredSkills((prev) => [...new Set([...prev, ...newSkills])]);
    }, 1500);
  };

  const handleNextQuestion = () => {
    setShowAnalysis(false);
    setCurrentAnswer("");

    if (currentQuestion < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setDemoComplete(true);
    }
  };

  const handleSkipQuestion = () => {
    setShowAnalysis(false);
    setCurrentAnswer("");

    if (currentQuestion < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setDemoComplete(true);
    }
  };

  // Demo Complete Screen
  if (demoComplete) {
    return (
      <Box
        data-testid="demo-complete"
        sx={{ minHeight: "100vh", backgroundColor: "#121212" }}
      >
        {/* Header */}
        <Box
          data-testid="demo-header"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid #333",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="CVstomize" style={{ height: 40 }} />
          </Box>
        </Box>

        <Container maxWidth="md" sx={{ py: 8 }}>
          <Fade in={true}>
            <Box data-testid="demo-results" sx={{ textAlign: "center" }}>
              <CheckIcon
                data-testid="demo-success-icon"
                sx={{ fontSize: 80, color: "#4caf50", mb: 2 }}
              />

              <Typography
                data-testid="demo-results-title"
                variant="h3"
                gutterBottom
              >
                Look What We Discovered!
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                From just {Object.keys(answers).length} stories, we found{" "}
                {discoveredSkills.length} hidden skills
              </Typography>

              {/* Skills Grid */}
              <Paper
                data-testid="demo-skills-grid"
                sx={{ p: 4, backgroundColor: "#1e1e1e", mb: 4 }}
              >
                <Typography
                  variant="overline"
                  color="secondary"
                  sx={{ mb: 2, display: "block" }}
                >
                  Your Discovered Skills
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  {discoveredSkills.map((skill, i) => (
                    <Chip
                      key={i}
                      icon={<SparkleIcon />}
                      label={skill}
                      color="secondary"
                      variant="outlined"
                      sx={{
                        animation: `fadeIn 0.3s ease-in-out ${i * 0.1}s both`,
                        "@keyframes fadeIn": {
                          from: { opacity: 0, transform: "scale(0.8)" },
                          to: { opacity: 1, transform: "scale(1)" },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                <strong>Imagine what a full conversation could reveal.</strong>
                <br />
                These skills have always been there — traditional resumes just
                never captured them.
              </Typography>

              {/* CTA */}
              <Paper
                data-testid="demo-cta-box"
                sx={{
                  p: 4,
                  backgroundColor: "rgba(253, 187, 45, 0.1)",
                  border: "2px solid #fdbb2d",
                  mb: 4,
                }}
              >
                <Typography
                  data-testid="demo-cta-title"
                  variant="h5"
                  gutterBottom
                >
                  Ready to Discover Your Full Potential?
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Create a free account to save your discoveries, answer more
                  questions, and generate a resume that shows your true value.
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    data-testid="demo-signup-btn"
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => navigate("/signup")}
                    sx={{ px: 4 }}
                  >
                    Create Free Account
                  </Button>
                  <Button
                    data-testid="demo-learn-more-btn"
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/")}
                  >
                    Learn More
                  </Button>
                </Box>
              </Paper>

              <Typography variant="caption" color="text.secondary">
                No credit card required. Your demo answers won't be saved
                without an account.
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>
    );
  }

  const currentQ = DEMO_QUESTIONS[currentQuestion];

  return (
    <Box
      data-testid="demo-page"
      sx={{ minHeight: "100vh", backgroundColor: "#121212" }}
    >
      {/* Header */}
      <Box
        data-testid="demo-nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid #333",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            data-testid="demo-back-btn"
            onClick={() => navigate("/")}
            color="inherit"
          >
            <BackIcon />
          </IconButton>
          <img
            src={logo}
            alt="CVstomize"
            style={{ height: 32 }}
            data-testid="demo-logo"
          />
          <Chip
            data-testid="demo-mode-chip"
            label="Demo Mode"
            size="small"
            color="secondary"
            variant="outlined"
          />
        </Box>
        <Button
          data-testid="demo-save-btn"
          variant="text"
          color="inherit"
          onClick={() => navigate("/signup")}
        >
          Create Account to Save
        </Button>
      </Box>

      {/* Progress */}
      <LinearProgress
        data-testid="demo-progress"
        variant="determinate"
        value={progress}
        color="secondary"
        sx={{ height: 4 }}
      />

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Question Counter */}
        <Typography
          data-testid="demo-question-counter"
          variant="overline"
          color="text.secondary"
          sx={{ mb: 1, display: "block" }}
        >
          Question {currentQuestion + 1} of {DEMO_QUESTIONS.length} •{" "}
          {currentQ.category}
        </Typography>

        {/* Skills discovered so far */}
        {discoveredSkills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="secondary">
              Skills discovered so far: {discoveredSkills.length}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
              {discoveredSkills.slice(-5).map((skill, i) => (
                <Chip
                  key={i}
                  label={skill}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ))}
              {discoveredSkills.length > 5 && (
                <Chip
                  label={`+${discoveredSkills.length - 5} more`}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Question Card */}
        <Paper
          data-testid="demo-question-card"
          elevation={4}
          sx={{
            p: 4,
            mb: 3,
            backgroundColor: "#1e1e1e",
            borderLeft: "4px solid #fdbb2d",
          }}
        >
          <Typography
            data-testid="demo-question-text"
            variant="h5"
            gutterBottom
          >
            {currentQ.question}
          </Typography>

          {!showAnalysis && (
            <>
              <TextField
                data-testid="demo-answer-input"
                fullWidth
                multiline
                rows={4}
                placeholder={currentQ.placeholder}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                variant="outlined"
                sx={{ mt: 2, mb: 2 }}
                disabled={isAnalyzing}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  data-testid="demo-skip-btn"
                  variant="text"
                  onClick={handleSkipQuestion}
                  disabled={isAnalyzing}
                >
                  Skip this question
                </Button>
                <Button
                  data-testid="demo-submit-btn"
                  variant="contained"
                  color="secondary"
                  endIcon={isAnalyzing ? null : <SendIcon />}
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() || isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Submit Answer"}
                </Button>
              </Box>

              {isAnalyzing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress color="secondary" />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    ✨ Our AI is analyzing your story for hidden skills...
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Analysis Results */}
          {showAnalysis && (
            <Slide direction="up" in={showAnalysis}>
              <Box data-testid="demo-analysis-results" sx={{ mt: 3 }}>
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: "rgba(253, 187, 45, 0.1)",
                    borderRadius: 2,
                    border: "1px solid rgba(253, 187, 45, 0.3)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <SparkleIcon color="secondary" />
                    <Typography
                      data-testid="demo-skills-found-title"
                      variant="h6"
                      color="secondary"
                    >
                      Skills Discovered From Your Story!
                    </Typography>
                  </Box>

                  <Box
                    data-testid="demo-discovered-skills"
                    sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}
                  >
                    {currentQ.skillsToDiscover.map((skill, i) => (
                      <Chip
                        key={i}
                        icon={<CheckIcon />}
                        label={skill}
                        color="secondary"
                        sx={{
                          animation: `popIn 0.3s ease-out ${i * 0.15}s both`,
                          "@keyframes popIn": {
                            from: { transform: "scale(0)", opacity: 0 },
                            to: { transform: "scale(1)", opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    💡{" "}
                    <strong>
                      Most people wouldn't think to include this on a resume.
                    </strong>{" "}
                    But these skills are valuable to employers — they just need
                    to see them presented the right way.
                  </Typography>
                </Box>

                <Button
                  data-testid="demo-next-btn"
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  endIcon={<ArrowIcon />}
                  onClick={handleNextQuestion}
                  sx={{ mt: 3 }}
                >
                  {currentQuestion < DEMO_QUESTIONS.length - 1
                    ? "Next Question"
                    : "See All Discovered Skills"}
                </Button>
              </Box>
            </Slide>
          )}
        </Paper>

        {/* Encouragement */}
        <Typography variant="body2" color="text.secondary" align="center">
          Don't worry about being perfect — just tell your story naturally.
          That's how we find the real skills.
        </Typography>
      </Container>
    </Box>
  );
}

export default DemoExperience;
