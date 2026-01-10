import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Fade,
  Chip,
  Collapse,
  IconButton,
  Grow,
  Zoom,
} from "@mui/material";
import {
  AutoAwesome as SparkleIcon,
  Psychology as BrainIcon,
  TrendingUp as GrowthIcon,
  PlayArrow as PlayIcon,
  ArrowForward as ArrowIcon,
  Handshake as HandshakeIcon,
  EmojiEmotions as HappyIcon,
  Savings as SavingsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Work as JobIcon,
  Business as EmployerIcon,
  Search as RecruiterIcon,
  Explore as ExplorerIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import logo from "./logo.png";

// Sample discovery questions to show the concept
const SAMPLE_QUESTIONS = [
  {
    question:
      "Tell me about a time you solved a problem no one else could figure out.",
    skill: "Creative Problem Solving",
    insight: "This story reveals analytical thinking and persistence",
  },
  {
    question: "What's something you taught yourself outside of work or school?",
    skill: "Self-Directed Learning",
    insight: "Shows initiative and ability to acquire new skills independently",
  },
  {
    question: "Describe a project you're proud of that wasn't for a job.",
    skill: "Project Management",
    insight:
      "Hobbies and side projects often demonstrate leadership and execution",
  },
];

const CollapsibleSection = ({ children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  // Update internal state if prop changes (e.g. when role is selected)
  useEffect(() => {
    setIsOpen(initiallyOpen);
  }, [initiallyOpen]);

  return (
    <>
      <Collapse in={isOpen} timeout="auto" unmountOnExit={false}>
        {children}
      </Collapse>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 2,
          width: "100%",
        }}
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          color="primary"
          aria-label={isOpen ? "collapse section" : "expand section"}
          sx={{
            border: "1px solid rgba(255, 255, 255, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            },
          }}
        >
          {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
    </>
  );
};

const RoleSelectionScreen = ({ onSelect }) => {
  const roles = [
    {
      id: "job-seeker",
      label: "Job Seeker",
      icon: <JobIcon fontSize="large" />,
      desc: "I want to discover my hidden skills and improve my resume.",
      color: "#2196f3", // Blue
    },
    {
      id: "recruiter",
      label: "Recruiter",
      icon: <RecruiterIcon fontSize="large" />,
      desc: "I want to find candidates with the right potential.",
      color: "#9c27b0", // Purple
    },
    {
      id: "employer",
      label: "Employer",
      icon: <EmployerIcon fontSize="large" />,
      desc: "I want to retain talent and maximize my workforce.",
      color: "#4caf50", // Green
    },
    {
      id: "explorer",
      label: "Explorer",
      icon: <ExplorerIcon fontSize="large" />,
      desc: "I'm just curious about how this technology works.",
      color: "#ff9800", // Orange
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121212",
        p: 4,
      }}
    >
      <Fade in={true} timeout={800}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <img
            src={logo}
            alt="CVstomize"
            style={{ height: 60, marginBottom: 24 }}
          />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
            Welcome to CVstomize
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              fontStyle: "italic",
              color: "#fdbb2d",
              fontWeight: 500,
            }}
          >
            "You're more capable than you know, we'll prove it."
          </Typography>
          <Typography variant="h6" color="text.secondary">
            To give you the best experience, tell us a bit about yourself.
          </Typography>
        </Box>
      </Fade>

      <Grid container spacing={4} maxWidth="lg" justifyContent="center">
        {roles.map((role, index) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Grow in={true} timeout={1000 + index * 200}>
              <Paper
                elevation={6}
                onClick={() => onSelect(role.id)}
                sx={{
                  p: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#1e1e1e",
                  border: "2px solid transparent",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: role.color,
                    transform: "translateY(-8px)",
                    boxShadow: `0 8px 24px ${role.color}40`,
                  },
                }}
              >
                <Box sx={{ color: role.color, mb: 2 }}>{role.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {role.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {role.desc}
                </Typography>
              </Paper>
            </Grow>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

function LandingPage() {
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleQuestionClick = (index) => {
    setShowInsight(false);
    setActiveQuestion(index);
    setTimeout(() => setShowInsight(true), 300);
  };

  useEffect(() => {
    // Auto-show insight after a delay
    const timer = setTimeout(() => setShowInsight(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!userRole) {
    return <RoleSelectionScreen onSelect={setUserRole} />;
  }

  // Dynamic Content Logic
  const getContentConfig = () => {
    switch (userRole) {
      case "recruiter":
        return {
          heroTitle: (
            <>
              Stop guessing. <span style={{ color: "#9c27b0" }}>Start knowing</span>{" "}
              your candidates.
            </>
          ),
          heroSubtitle:
            "Traditional resumes hide potential. Our AI conversations reveal the hidden skills, character, and drive that keywords miss — providing authentic insights backed by real stories, not generated fluff.",
          openHero: true,
          openValueProps: false,
          openWinWin: true, // Recruiter cares about the benefits
          order: ["hero", "winwin", "valueprops"],
        };
      case "employer":
        return {
          heroTitle: (
            <>
              Maximize the <span style={{ color: "#4caf50" }}>hidden potential</span>{" "}
              in your workforce.
            </>
          ),
          heroSubtitle:
            "Reduce turnover and save on training by discovering the skills your employees already have but haven't told you about. We uncover authentic potential grounded in reality, not wishful thinking.",
          openHero: true,
          openValueProps: false,
          openWinWin: true, // Employer cares about Win-Win
          order: ["hero", "winwin", "valueprops"],
        };
      case "explorer":
        return {
          heroTitle: (
            <>
              Experience the <span style={{ color: "#ff9800" }}>future</span> of
              talent discovery.
            </>
          ),
          heroSubtitle:
            "See how conversational AI is replacing static documents to create a deeper, more accurate picture of human potential. Our focus is on truth and accuracy, not just creative writing.",
          openHero: true,
          openValueProps: true,
          openWinWin: false,
          order: ["hero", "valueprops", "winwin"],
        };
      case "job-seeker":
      default:
        return {
          heroTitle: (
            <>
              "You're more capable than you know.{" "}
              <span style={{ color: "#fdbb2d" }}>We'll Prove it.</span>"
            </>
          ),
          heroSubtitle:
            "Traditional resumes only capture job titles and degrees. CVstomize discovers your hidden talents — from life experiences, hobbies, and stories you've never told. We help you articulate your true value, without exaggeration.",
          openHero: true,
          openValueProps: false,
          openWinWin: false,
          order: ["hero", "valueprops", "winwin"],
        };
    }
  };

  const config = getContentConfig();

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case "hero":
        return (
          <Container
            key="hero"
            data-testid="landing-hero"
            maxWidth="lg"
            sx={{ pt: 8, pb: 6 }}
          >
            <CollapsibleSection initiallyOpen={config.openHero}>
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography
                    data-testid="landing-hero-title"
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                  >
                    {config.heroTitle}
                  </Typography>

                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    {config.heroSubtitle}
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      color: "#fff",
                      fontWeight: 500,
                      borderLeft: "4px solid #fdbb2d",
                      pl: 2,
                    }}
                  >
                    You tell us your story in your own words. We craft you a
                    ready-to-save PDF.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      data-testid="landing-demo-btn"
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<PlayIcon />}
                      onClick={() => navigate("/demo")}
                      sx={{ px: 4, py: 1.5 }}
                    >
                      Try the Demo
                    </Button>
                    <Button
                      data-testid="landing-signup-btn"
                      variant="outlined"
                      size="large"
                      endIcon={<ArrowIcon />}
                      onClick={() => navigate("/signup")}
                      sx={{ px: 4, py: 1.5 }}
                    >
                      Create Free Account
                    </Button>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    No credit card required. Explore everything first.
                  </Typography>
                </Grid>

                {/* Interactive Demo Preview */}
                <Grid item xs={12} md={6}>
                  <Paper
                    data-testid="landing-demo-preview"
                    elevation={8}
                    sx={{
                      p: 3,
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #333",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      ✨ See How It Works
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Our AI asks questions like:
                    </Typography>

                    {/* Question Tabs */}
                    <Box
                      sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}
                    >
                      {SAMPLE_QUESTIONS.map((q, i) => (
                        <Chip
                          key={i}
                          label={`Question ${i + 1}`}
                          onClick={() => handleQuestionClick(i)}
                          color={activeQuestion === i ? "secondary" : "default"}
                          variant={activeQuestion === i ? "filled" : "outlined"}
                          sx={{ cursor: "pointer" }}
                        />
                      ))}
                    </Box>

                    {/* Active Question */}
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: "#252525",
                        borderLeft: "3px solid #fdbb2d",
                      }}
                    >
                      <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                        "{SAMPLE_QUESTIONS[activeQuestion].question}"
                      </Typography>
                    </Paper>

                    {/* Discovered Skill */}
                    <Fade in={showInsight}>
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <SparkleIcon color="secondary" fontSize="small" />
                          <Typography variant="subtitle2" color="secondary">
                            Skill Discovered:
                          </Typography>
                        </Box>
                        <Chip
                          label={SAMPLE_QUESTIONS[activeQuestion].skill}
                          color="secondary"
                          sx={{ mb: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          💡 {SAMPLE_QUESTIONS[activeQuestion].insight}
                        </Typography>
                      </Box>
                    </Fade>
                  </Paper>
                </Grid>
              </Grid>
            </CollapsibleSection>
          </Container>
        );
      case "valueprops":
        return (
          <Box
            key="valueprops"
            data-testid="landing-value-props"
            sx={{ backgroundColor: "#1a1a1a", py: 8 }}
          >
            <Container maxWidth="lg">
              <CollapsibleSection initiallyOpen={config.openValueProps}>
                <Typography
                  data-testid="landing-value-props-title"
                  variant="h4"
                  align="center"
                  gutterBottom
                >
                  Why CVstomize is Different
                </Typography>
                <Typography
                  variant="body1"
                  align="center"
                  color="text.secondary"
                  sx={{ mb: 6, maxWidth: 600, mx: "auto" }}
                >
                  Other resume builders fill templates. We have conversations
                  that reveal skills you didn't know you had.
                </Typography>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", backgroundColor: "#252525" }}>
                      <CardContent>
                        <BrainIcon
                          sx={{ fontSize: 48, color: "#fdbb2d", mb: 2 }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Story-Driven Discovery
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Our AI asks thoughtful questions that uncover skills
                          from your hobbies, side projects, volunteer work, and
                          life experiences. We focus on factual evidence so every
                          skill is defensible.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", backgroundColor: "#252525" }}>
                      <CardContent>
                        <VerifiedIcon
                          sx={{ fontSize: 48, color: "#9d99e5", mb: 2 }}
                        />
                        <Typography variant="h6" gutterBottom>
                          Authenticity Guaranteed
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Our AI is trained to identify *real* skills, not to
                          invent them. We help you articulate your true strengths
                          without exaggeration or stretching the truth.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: "100%", backgroundColor: "#252525" }}>
                      <CardContent>
                        <GrowthIcon
                          sx={{ fontSize: 48, color: "#4caf50", mb: 2 }}
                        />
                        <Typography variant="h6" gutterBottom>
                          True Value, Finally Visible
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Employers miss talent when resumes only show the
                          obvious. We help you and your next employer see your
                          complete potential. Your real stories are enough.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ textAlign: "center", mt: 6 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => navigate("/demo")}
                    sx={{ px: 6, py: 1.5 }}
                  >
                    Try It Free — No Sign Up Required
                  </Button>
                </Box>
              </CollapsibleSection>
            </Container>
          </Box>
        );
      case "winwin":
        return (
          <Box key="winwin" data-testid="landing-winwin" sx={{ py: 8 }}>
            <Container maxWidth="lg">
              <CollapsibleSection initiallyOpen={config.openWinWin}>
                <Typography
                  data-testid="landing-winwin-title"
                  variant="h4"
                  align="center"
                  gutterBottom
                >
                  A Win-Win for Everyone
                </Typography>
                <Typography
                  variant="body1"
                  align="center"
                  color="text.secondary"
                  sx={{ mb: 6, maxWidth: 700, mx: "auto" }}
                >
                  When employees find purpose in their work, everyone benefits.
                  CVstomize bridges the gap between hidden potential and
                  opportunity.
                </Typography>

                <Grid container spacing={4}>
                  {/* Employee Benefits */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      data-testid="landing-employee-benefits"
                      sx={{
                        p: 4,
                        height: "100%",
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #4caf50",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <HappyIcon sx={{ fontSize: 40, color: "#4caf50" }} />
                        <Typography variant="h5" sx={{ color: "#4caf50" }}>
                          For Employees
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Typography variant="body1">
                          ✓ <strong>Get the best possible resume</strong> —
                          AI-crafted to showcase your true value
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Find purpose in your work</strong> — match
                          your real skills to the right opportunities
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Stop feeling undervalued</strong> — finally
                          show employers what you're capable of
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Discover hidden talents</strong> — skills
                          you didn't know you had
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Employer Benefits */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      data-testid="landing-employer-benefits"
                      sx={{
                        p: 4,
                        height: "100%",
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #fdbb2d",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <SavingsIcon sx={{ fontSize: 40, color: "#fdbb2d" }} />
                        <Typography variant="h5" sx={{ color: "#fdbb2d" }}>
                          For Employers
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Typography variant="body1">
                          ✓ <strong>Get the most out of every hire</strong> —
                          see the full picture, not just job titles
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Happy employees = less turnover</strong> —
                          people who find purpose stay longer
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Save money on training</strong> — reduced
                          turnover means fewer new hires to onboard
                        </Typography>
                        <Typography variant="body1">
                          ✓ <strong>Better role matching</strong> — place people
                          where they'll thrive, not just survive
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* The Core Message */}
                <Paper
                  sx={{
                    mt: 6,
                    p: 4,
                    backgroundColor: "transparent",
                    border: "1px solid #9d99e5",
                    textAlign: "center",
                  }}
                >
                  <HandshakeIcon
                    sx={{ fontSize: 48, color: "#9d99e5", mb: 2 }}
                  />
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: "#e0e0e0" }}
                  >
                    The Real Win?
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 600, mx: "auto" }}
                  >
                    When employees can easily find purpose in their job, they're
                    happier. Happy employees stay. Lower turnover saves
                    employers thousands on recruiting and training.
                    <strong style={{ color: "#fdbb2d" }}>
                      {" "}
                      Everyone wins.
                    </strong>
                  </Typography>
                </Paper>
              </CollapsibleSection>
            </Container>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      id="landing-page-container"
      data-testid="landing-page"
      sx={{ minHeight: "100vh", backgroundColor: "#121212" }}
    >
      {/* Navigation */}
      <Box
        id="landing-nav-container"
        data-testid="landing-nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid #333",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            id="landing-logo"
            src={logo}
            alt="CVstomize"
            style={{ height: 40 }}
            data-testid="landing-logo"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            id="landing-signin-btn"
            data-testid="landing-signin-btn"
            variant="text"
            color="inherit"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <Button
            id="landing-getstarted-btn"
            data-testid="landing-getstarted-btn"
            variant="contained"
            color="secondary"
            onClick={() => navigate("/signup")}
          >
            Get Started Free
          </Button>
        </Box>
      </Box>

      {/* Render sections in configured order */}
      {config.order.map((section) => renderSection(section))}

      {/* Final CTA - Always at bottom */}
      <Box
        id="landing-final-cta-container"
        data-testid="landing-final-cta"
        sx={{ backgroundColor: "#fdbb2d", py: 6 }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            id="landing-final-cta-title"
            data-testid="landing-final-cta-title"
            variant="h4"
            sx={{ color: "#000", mb: 1 }}
          >
            Ready to discover what you're really worth?
          </Typography>
          <Typography variant="body1" sx={{ color: "#333", mb: 3 }}>
            Get the resume that shows your true potential — and find work that
            values it.
          </Typography>
          <Button
            id="landing-final-cta-btn"
            data-testid="landing-final-cta-btn"
            variant="contained"
            size="large"
            onClick={() => navigate("/demo")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              px: 6,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#333",
              },
            }}
          >
            Start Your Free Discovery
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        data-testid="landing-footer"
        sx={{ py: 4, textAlign: "center", borderTop: "1px solid #333" }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} CVstomize. You have skills you've never
          thought to put on a resume.
        </Typography>
      </Box>
    </Box>
  );
}

export default LandingPage;
