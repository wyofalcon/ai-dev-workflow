import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Fade,
  LinearProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Save as SaveIcon,
  SkipNext as SkipIcon,
} from "@mui/icons-material";

// Configuration for the 12-step flow
const FLOW_STEPS = [
  {
    id: "intro",
    type: "message",
    content: "Hi! I'm your CVstomize assistant. 🤖 I'm going to ask you a series of questions to build your perfect resume.",
    next: "intro_2"
  },
  {
    id: "intro_2",
    type: "message",
    content: "We'll go through 12 sections, from Contact Info to Formatting. I'll ask one thing at a time so it's not overwhelming.",
    next: "intro_3"
  },
  {
    id: "intro_3",
    type: "message",
    content: "Remember: You can stop at any time! If you create an account, I'll save your progress so you can finish later. Ready to start?",
    next: "contact_intro",
    options: [{ label: "Let's Go!", value: "start" }]
  },
  
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
      { label: "No", value: "no", next: "career_intro" } // End of Section 1
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

  // 🎯 2. Career Target (Placeholder for next sections)
  {
    id: "career_intro",
    type: "info",
    title: "🎯 Section 2: Career Target",
    content: "Now, let's focus on what you're looking for. This helps tailor the resume tone.",
    next: "finish_demo" // Temporary end for this scaffold
  },
  {
    id: "finish_demo",
    type: "message",
    content: "This is a preview of the Easy CV flow! In the full version, we'd continue through all 12 sections.",
    next: "cta"
  },
  {
    id: "cta",
    type: "final",
    content: "Ready to save your progress and build the real thing?",
  }
];

function EasyCvWizard() {
  const navigate = useNavigate();
  const [currentStepId, setCurrentStepId] = useState("intro");
  const [history, setHistory] = useState([]); // Array of { role: 'bot'|'user', content: string }
  const [answers, setAnswers] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const messagesEndRef = useRef(null);

  const currentStep = FLOW_STEPS.find(s => s.id === currentStepId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping]);

  // Handle step logic
  useEffect(() => {
    if (!currentStep) return;

    // Simulate typing delay
    setIsTyping(true);
    const delay = currentStep.type === "message" ? 1000 : 600;

    const timer = setTimeout(() => {
      setIsTyping(false);
      
      // Add bot message to history
      const messageContent = currentStep.content;
      setHistory(prev => [...prev, { 
        role: "bot", 
        content: messageContent,
        type: currentStep.type,
        title: currentStep.title 
      }]);

      // Auto-advance informational steps
      if (currentStep.type === "message" || currentStep.type === "info") {
         if (currentStep.next && !currentStep.options) {
             setTimeout(() => setCurrentStepId(currentStep.next), 1500); // Wait a bit before next
         }
      }

    }, delay);

    return () => clearTimeout(timer);
  }, [currentStepId]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Save answer
    if (currentStep.field) {
      setAnswers(prev => ({ ...prev, [currentStep.field]: inputValue }));
    }

    // Add user message
    setHistory(prev => [...prev, { role: "user", content: inputValue }]);
    setInputValue("");

    // Move to next step
    if (currentStep.next) {
      setCurrentStepId(currentStep.next);
    }
  };

  const handleOptionClick = (option) => {
    // Save answer if needed (using value)
    if (currentStep.field) {
       setAnswers(prev => ({ ...prev, [currentStep.field]: option.value }));
    }

    // Add user choice
    setHistory(prev => [...prev, { role: "user", content: option.label }]);

    // Determine next step (option-specific next takes precedence)
    const nextStep = option.next || currentStep.next;
    if (nextStep) {
      setCurrentStepId(nextStep);
    }
  };

  const handleSaveAndExit = () => {
      navigate("/signup", { state: { savedAnswers: answers } });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#121212",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 2
      }}
    >
      {/* Header */}
      <Box sx={{ width: "100%", maxWidth: 600, px: 2, mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            Save
        </Button>
      </Box>

      {/* Chat Area */}
      <Paper
        elevation={0}
        sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: 600,
            bgcolor: "transparent",
            overflowY: "auto",
            px: 2,
            pb: 12, // Space for input area
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
                {/* Info Cards (Section Headers) */}
                {msg.type === "info" && (
                    <Fade in={true}>
                        <Paper sx={{ p: 2, mb: 1, bgcolor: "rgba(33, 150, 243, 0.1)", border: "1px solid #2196f3", borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                                {msg.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#ddd" }}>
                                {msg.content}
                            </Typography>
                        </Paper>
                    </Fade>
                )}

                {/* Normal Messages */}
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

        {/* Typing Indicator */}
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

      {/* Input Area */}
      <Box 
        sx={{ 
            position: "fixed", 
            bottom: 0, 
            width: "100%", 
            maxWidth: 600, 
            p: 2, 
            bgcolor: "#121212",
            borderTop: "1px solid #333" 
        }}
      >
        {/* Options (Buttons) */}
        {!isTyping && currentStep?.options && (
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

        {/* Final Call to Action */}
        {currentStep?.type === "final" && (
             <Button 
                fullWidth 
                variant="contained" 
                color="secondary" 
                size="large"
                onClick={handleSaveAndExit}
            >
                Create Account to Finish
             </Button>
        )}

        {/* Text Input */}
        {(!currentStep?.options && currentStep?.type !== "final" && currentStep?.type !== "info" && currentStep?.type !== "message") && (
            <form onSubmit={handleInputSubmit} style={{ display: "flex", gap: 1 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={currentStep?.placeholder || "Type your answer..."}
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

      {/* Save Dialog */}
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
