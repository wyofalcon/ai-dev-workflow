import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Fade,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

// Configuration for the flow
const FLOW_STEPS = [
  // 🧩 1. Contact & Identity
  {
    id: "contact_intro",
    type: "info",
    title: "🧩 Section 1: Contact & Identity",
    content: "First, let's get your basic contact details so employers can reach you. This helps us generate the header of your resume.",
    next: "name"
  },
  {
    id: "name",
    type: "question",
    content: "What is your full name as you want it displayed?",
    field: "fullName",
    placeholder: "e.g. Jane Doe",
    next: "location"
  },
  {
    id: "location",
    type: "question",
    content: "What city and state do you want listed?",
    field: "location",
    placeholder: "e.g. San Francisco, CA",
    next: "phone"
  },
  {
    id: "phone",
    type: "question",
    content: "What phone number should appear?",
    field: "phone",
    placeholder: "e.g. (555) 123-4567",
    next: "email"
  },
  {
    id: "email",
    type: "question",
    content: "What email address should appear?",
    field: "email",
    placeholder: "e.g. jane@example.com",
    next: "linkedin_check"
  },
  {
    id: "linkedin_check",
    type: "question",
    content: "Do you want to include a LinkedIn profile?",
    options: [
      { label: "Yes", value: "yes", next: "linkedin_url" },
      { label: "No", value: "no", next: "portfolio_check" }
    ]
  },
  {
    id: "linkedin_url",
    type: "question",
    content: "Great! Paste your LinkedIn URL here:",
    field: "linkedin",
    placeholder: "linkedin.com/in/...",
    next: "portfolio_check"
  },
  {
    id: "portfolio_check",
    type: "question",
    content: "Do you want to include a portfolio, GitHub, or personal website?",
    options: [
      { label: "Yes", value: "yes", next: "portfolio_url" },
      { label: "No", value: "no", next: "career_intro" } // Handover point
    ]
  },
  {
    id: "portfolio_url",
    type: "question",
    content: "Please paste the link(s) here:",
    field: "website",
    placeholder: "github.com/jane or janedoe.com",
    next: "career_intro"
  },

  // 🎯 2. Career Target - Replaced by AI Handover
  {
    id: "career_intro",
    type: "info",
    title: "🎯 Section 2: Career Target",
    content: "Now, let's focus on who you are as a professional. I'm going to ask you a few open-ended questions.",
    next: "career_reminder"
  },
  {
    id: "career_reminder",
    type: "message",
    content: "Building a great summary can take a bit of effort, but it's worth it! If you need a break, you can save your progress and continue later by creating a profile.",
    next: "ai_handover"
  },
  
  // Note: Remaining structured steps (Work, Edu, etc.) would be here in a full hybrid model,
  // but we are pivoting to AI conversation for the summary/target first.
  // We can re-integrate structured loops later if the AI conversation ends or needs specific data.
];

// Live Resume Preview Component
const LiveResumePreview = ({ answers }) => {
  return (
    <Paper
      elevation={4}
      sx={{
        height: "100%",
        maxHeight: "80vh",
        overflowY: "auto",
        p: 4,
        bgcolor: "#fff",
        color: "#333",
        borderRadius: 2,
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
        Live Preview
      </Typography>

      {/* Header */}
      <Box sx={{ mb: 3, textAlign: "center", borderBottom: "2px solid #333", pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", textTransform: "uppercase" }}>
          {answers.fullName || "Your Name"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {[answers.location, answers.phone, answers.email, answers.website]
            .filter(Boolean)
            .join(" | ")}
        </Typography>
        {answers.linkedin && (
          <Typography variant="body2" color="primary">
            {answers.linkedin}
          </Typography>
        )}
      </Box>

      {/* Career Target / Summary from AI */}
      {answers.summary && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Professional Summary
          </Typography>
          <Typography variant="body2" fontStyle="italic">
            {answers.summary}
          </Typography>
        </Box>
      )}

      {/* Skills */}
      {(answers.languages || answers.tools || answers.softSkills) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Skills
          </Typography>
          <Typography variant="body2">
            {[answers.languages, answers.tools, answers.cloudTools, answers.softSkills]
              .filter(Boolean)
              .join(", ")}
          </Typography>
        </Box>
      )}

      {/* Work Experience */}
      {(answers.workHistory?.length > 0 || answers.temp_company) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Experience
          </Typography>
          {/* Confirmed Jobs */}
          {answers.workHistory?.map((job, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {job.title} at {job.company}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {job.dates} | {job.location}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {job.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

function EasyCvWizard() {
  const navigate = useNavigate();
  const [currentStepId, setCurrentStepId] = useState("contact_intro");
  const [history, setHistory] = useState([]); 
  const [answers, setAnswers] = useState({ workHistory: [], projects: [], education: [] });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  
  // AI State
  const [isAiMode, setIsAiMode] = useState(false);
  const [interventionMode, setInterventionMode] = useState(false);
  const [preInterventionStep, setPreInterventionStep] = useState(null);

  const messagesEndRef = useRef(null);

  const currentStep = FLOW_STEPS.find(s => s.id === currentStepId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping]);

  // Mock AI Logic (To be replaced with Vertex AI backend)
  const mockAiResponse = async (userText) => {
    setIsTyping(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple mock logic based on length
    if (userText.length < 20) {
        return "That's a bit brief. Can you tell me more? Specifically, what kind of tasks did you do daily?";
    } else {
        return "Great! Based on that, it sounds like you're proactive. Are you usually the one to organize team activities or lead meetings?";
    }
  };

  // Effect to trigger AI Handover
  useEffect(() => {
    if (currentStepId === "ai_handover" && !isAiMode) {
        setIsAiMode(true);
        // Initial AI Question
        const initialQuestion = "In your own words, tell me how you see yourself at work? What excites you? Are you usually the first one to meetings?";
        
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setHistory(prev => [...prev, { role: "bot", content: initialQuestion }]);
        }, 1000);
    }
  }, [currentStepId, isAiMode]);

  // Standard Step Logic
  useEffect(() => {
    if (!currentStep || isAiMode || interventionMode) return;

    setIsTyping(true);
    const delay = currentStep.type === "message" ? 1000 : 600;

    const timer = setTimeout(() => {
      setIsTyping(false);
      
      const messageContent = currentStep.content;
      setHistory(prev => [...prev, { 
        role: "bot", 
        content: messageContent,
        type: currentStep.type,
        title: currentStep.title 
      }]);

      if (currentStep.type === "message" || currentStep.type === "info") {
         if (currentStep.next && !currentStep.options) {
             setTimeout(() => setCurrentStepId(currentStep.next), 1500);
         }
      }

    }, delay);

    return () => clearTimeout(timer);
  }, [currentStepId, isAiMode, interventionMode]);

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    setHistory(prev => [...prev, { role: "user", content: inputValue }]);
    const currentInput = inputValue;
    setInputValue("");

    // --- AI MODE LOGIC ---
    if (isAiMode) {
        // Here we would call the backend
        const aiReply = await mockAiResponse(currentInput);
        setIsTyping(false);
        setHistory(prev => [...prev, { role: "bot", content: aiReply }]);
        
        // Save to summary for preview
        setAnswers(prev => ({ ...prev, summary: (prev.summary ? prev.summary + " " : "") + currentInput }));
        return;
    }

    // --- INTERVENTION MODE LOGIC ---
    if (interventionMode) {
        // User answered the intervention
        // Append to the original field
        const fieldName = preInterventionStep.field;
        setAnswers(prev => ({ ...prev, [fieldName]: prev[fieldName] + " " + currentInput }));
        
        // Resume flow
        setInterventionMode(false);
        setHistory(prev => [...prev, { role: "bot", content: "Thanks for clarifying! Moving on." }]);
        setCurrentStepId(preInterventionStep.next);
        return;
    }

    // --- STANDARD FLOW LOGIC ---
    
    // Save answer
    if (currentStep.field) {
      setAnswers(prev => ({ ...prev, [currentStep.field]: currentInput }));
    }

    // Check for Intervention (Supervisor)
    // Example rule: If describing work/project and length < 15 chars
    if ((currentStep.id === "work_responsibilities" || currentStep.id === "project_problem") && currentInput.length < 15) {
        setInterventionMode(true);
        setPreInterventionStep(currentStep);
        
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setHistory(prev => [...prev, { role: "bot", content: "That's a bit short. Could you give me more detail? What specific tools or methods did you use?" }]);
        }, 800);
        return; // Pause standard flow
    }

    // Move to next step
    if (currentStep.next) {
      setCurrentStepId(currentStep.next);
    }
  };

  const handleOptionClick = (option) => {
    // 1. Save specific field answer if present
    if (currentStep.field) {
       setAnswers(prev => ({ ...prev, [currentStep.field]: option.value }));
    }

    // 2. Logic to "Commit" repeating sections
    // (Logic omitted for brevity in this specific update, but would remain same as previous version)
    // ...

    setHistory(prev => [...prev, { role: "user", content: option.label }]);

    const nextStep = option.next || currentStep.next;
    if (nextStep) {
      setCurrentStepId(nextStep);
    }
  };

  const handleSaveAndExit = () => {
      navigate("/signup", { state: { savedAnswers: answers } });
  };

  // Render Consent or Chat
  if (showConsent) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#121212",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2
        }}
      >
        <Paper
          elevation={10}
          sx={{
            maxWidth: 500,
            width: "100%",
            p: 4,
            bgcolor: "#1e1e1e",
            color: "#fff",
            textAlign: "center",
            border: "1px solid #333",
            borderRadius: 4
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#fdbb2d" }}>
            Professional Data Collection
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "#ccc", lineHeight: 1.6 }}>
            To use Easy CV without an account, we need to collect your professional data (skills, experience, education).
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "#fdbb2d", fontWeight: "bold" }}>
            ⚠️ Note: This process may take a while as we build a complete picture of your background.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "#ccc", lineHeight: 1.6 }}>
            You can <strong>save your progress</strong> and continue later by creating a CVstom Profile. 
            Or, if you already have a resume, you can <strong>upload it directly</strong> to your profile to save time!
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: "#999", fontStyle: "italic" }}>
            Your personal contact information remains private and secure.
          </Typography>
          
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              onClick={() => {
                setShowConsent(false);
                setHistory([{ 
                  role: "bot", 
                  content: "Thanks! Let's get your contact info first. Remember, you can save and stop at any time by clicking 'Save' at the top.", 
                  type: "message" 
                }]);
              }}
              sx={{ py: 1.5, fontWeight: "bold" }}
            >
              I Agree, Start Easy CV
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => navigate("/signup")}
            >
              Create Profile / Upload Resume
            </Button>
            <Button 
              variant="text" 
              color="error" 
              size="small"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#121212",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Bar */}
      <Box sx={{ width: "100%", px: 2, py: 1, bgcolor: "#1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333" }}>
        <IconButton onClick={() => navigate("/")} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: "bold" }}>
            Easy CV Builder
        </Typography>
        <Button 
            startIcon={<SaveIcon />} 
            size="small" 
            variant="outlined" 
            color="secondary"
            onClick={() => setShowSaveDialog(true)}
        >
            Save Progress
        </Button>
      </Box>

      {/* Main Content: Split Layout */}
      <Box sx={{ display: "flex", width: "100%", maxWidth: "1400px", flexGrow: 1, overflow: "hidden" }}>
        
        {/* Left: Chat Interface */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", borderRight: "1px solid #333" }}>
            <Paper
                elevation={0}
                sx={{
                    flexGrow: 1,
                    bgcolor: "transparent",
                    overflowY: "auto",
                    px: 3,
                    pb: 12,
                    pt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2
                }}
            >
                {history.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                            width: msg.type === "info" ? "100%" : "auto"
                        }}
                    >
                        {msg.type === "info" && (
                            <Fade in={true}>
                                <Paper sx={{ p: 2, mb: 1, bgcolor: "rgba(253, 187, 45, 0.1)", border: "1px solid #fdbb2d", borderRadius: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#fdbb2d" }}>
                                        {msg.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#ddd" }}>
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </Fade>
                        )}

                        {msg.type !== "info" && (
                            <Fade in={true}>
                                <Box sx={{ display: "flex", gap: 1, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                                    {msg.role === "bot" && (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#fdbb2d" }}>
                                            <AiIcon sx={{ fontSize: 20, color: "#000" }} />
                                        </Avatar>
                                    )}
                                    <Paper
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: msg.role === "user" ? "#fdbb2d" : "#252525",
                                            color: msg.role === "user" ? "#000" : "#fff",
                                            borderTopLeftRadius: msg.role === "bot" ? 4 : 24,
                                            borderTopRightRadius: msg.role === "user" ? 4 : 24,
                                        }}
                                    >
                                        <Typography variant="body1">{msg.content}</Typography>
                                    </Paper>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                ))}

                {isTyping && (
                    <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#fdbb2d" }}>
                            <AiIcon sx={{ fontSize: 20, color: "#000" }} />
                        </Avatar>
                        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "#252525", borderTopLeftRadius: 4 }}>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite 0.2s" }} />
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite 0.4s" }} />
                            </Box>
                        </Paper>
                    </Box>
                )}
                
                <div ref={messagesEndRef} />
            </Paper>

            <Box 
                sx={{ 
                    position: "absolute", 
                    bottom: 0, 
                    left: 0,
                    right: 0, 
                    p: 2, 
                    bgcolor: "#121212",
                    borderTop: "1px solid #333" 
                }}
            >
                {!isTyping && currentStep?.options && !isAiMode && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
                        {currentStep.options.map((opt, i) => (
                            <Chip 
                                key={i} 
                                label={opt.label} 
                                onClick={() => handleOptionClick(opt)}
                                sx={{ 
                                    bgcolor: "#fdbb2d", 
                                    color: "#000", 
                                    fontWeight: "bold",
                                    "&:hover": { bgcolor: "#fff" }
                                }} 
                                clickable
                            />
                        ))}
                    </Stack>
                )}

                {currentStep?.type === "final" && (
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="secondary" 
                        size="large"
                        onClick={handleSaveAndExit}
                    >
                        Generate & Create One Profile
                    </Button>
                )}

                {(!currentStep?.options && currentStep?.type !== "final" && currentStep?.type !== "info" && currentStep?.type !== "message") || isAiMode && (
                    <form onSubmit={handleInputSubmit} style={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={isAiMode ? "Type your response..." : (currentStep?.placeholder || "Type your answer...")}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                            autoFocus
                            sx={{
                                bgcolor: "#1e1e1e",
                                borderRadius: 1,
                                "& .MuiOutlinedInput-root": { color: "#fff" }
                            }}
                        />
                        <IconButton 
                            type="submit" 
                            color="secondary" 
                            disabled={!inputValue.trim() || isTyping}
                            sx={{ bgcolor: "rgba(253, 187, 45, 0.1)" }}
                        >
                            <SendIcon />
                        </IconButton>
                    </form>
                )}
            </Box>
        </Box>

        {/* Right: Live Preview (Hidden on mobile) */}
        <Box sx={{ 
            width: "400px", 
            p: 2, 
            display: { xs: "none", md: "block" },
            bgcolor: "#f5f5f5" // Light background for document feel
        }}>
            <LiveResumePreview answers={answers} />
        </Box>

      </Box>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Progress?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To save your answers and continue later, you need to create a free account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAndExit} variant="contained" color="primary">
            Create Account
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default EasyCvWizard;