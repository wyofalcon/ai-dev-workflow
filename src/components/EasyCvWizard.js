import React, { useState, useEffect, useRef } from "react";
// [FEAT-EASYCV-REDESIGN-001] Redesign Easy CV Wizard - Contained Chat + Paper-Sized Resume Preview + Interactive Sections
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
  Menu,
  MenuItem,
  Tooltip,
  Zoom,
  Fab
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Save as SaveIcon,
  Minimize as MinimizeIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import LandingPage from "./LandingPage";

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

// Interactive Section Wrapper
const EditableSection = ({ id, label, onEdit, children, isEmpty }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  if (isEmpty) return null;

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
    onEdit(id, label);
  };

  return (
    <>
      <Tooltip title="Click to Edit" arrow placement="left">
        <Box
          onClick={handleClick}
          sx={{
            cursor: "pointer",
            borderRadius: 1,
            p: 0.5,
            m: -0.5,
            "&:hover": {
              bgcolor: "rgba(33, 150, 243, 0.08)",
              outline: "1px dashed #2196f3",
            },
            position: "relative",
            transition: "all 0.2s"
          }}
        >
          {children}
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit {label}
        </MenuItem>
        {/* Placeholder for future delete functionality */}
        {/* <MenuItem onClick={handleClose}><DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Clear</MenuItem> */}
      </Menu>
    </>
  );
};

// Live Resume Preview Component (Paper Style)
const LiveResumePreview = ({ answers, onEditSection }) => {
  return (
    <Box sx={{ 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      justifyContent: "center",
      overflowY: "auto",
      py: 4,
      bgcolor: "#525659" // Acrobat dark grey background
    }}>
      <Paper
        elevation={6}
        sx={{
          width: "216mm", // A4/Letter approx width
          minHeight: "279mm", // Letter height
          maxWidth: "100%",
          p: 5,
          bgcolor: "#fff",
          color: "#333",
          borderRadius: 0,
          fontFamily: "'Roboto', sans-serif",
          boxSizing: "border-box",
          position: "relative",
          mb: 4
        }}
      >
        {/* Header Section */}
        <EditableSection 
          id="header" 
          label="Contact Info" 
          onEdit={onEditSection} 
          isEmpty={!answers.fullName && !answers.email}
        >
          <Box sx={{ mb: 3, textAlign: "center", borderBottom: "2px solid #333", pb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "2rem" }}>
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
        </EditableSection>

        {/* Career Target / Summary */}
        <EditableSection 
          id="summary" 
          label="Summary" 
          onEdit={onEditSection} 
          isEmpty={!answers.summary}
        >
          {answers.summary && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 1 }}>
                Professional Summary
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {answers.summary}
              </Typography>
            </Box>
          )}
        </EditableSection>

        {/* Skills */}
        <EditableSection 
          id="skills" 
          label="Skills" 
          onEdit={onEditSection} 
          isEmpty={!answers.languages && !answers.tools && !answers.softSkills}
        >
          {(answers.languages || answers.tools || answers.softSkills) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 1 }}>
                Skills
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {[answers.languages, answers.tools, answers.cloudTools, answers.softSkills]
                  .filter(Boolean)
                  .join(", ")}
              </Typography>
            </Box>
          )}
        </EditableSection>

        {/* Work Experience */}
        <EditableSection 
          id="work" 
          label="Experience" 
          onEdit={onEditSection} 
          isEmpty={!answers.workHistory?.length && !answers.temp_company}
        >
          {(answers.workHistory?.length > 0 || answers.temp_company) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 1 }}>
                Experience
              </Typography>
              {/* Confirmed Jobs */}
              {answers.workHistory?.map((job, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {job.title} at {job.company}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {job.dates} | {job.location}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {job.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </EditableSection>
        
        {/* Page Number (Simulated) */}
        <Box sx={{ position: "absolute", bottom: 20, right: 30, opacity: 0.5 }}>
            <Typography variant="caption">Page 1</Typography>
        </Box>
      </Paper>
    </Box>
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
  const [isMinimized, setIsMinimized] = useState(false);
  
  // AI State
  const [isAiMode, setIsAiMode] = useState(false);
  const [interventionMode, setInterventionMode] = useState(false);
  const [preInterventionStep, setPreInterventionStep] = useState(null);
  
  // Edit Mode State
  const [editingSection, setEditingSection] = useState(null);

  const messagesEndRef = useRef(null);

  const currentStep = FLOW_STEPS.find(s => s.id === currentStepId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping]);

  // Handle Edit Request from Preview
  const handleSectionEdit = (sectionId, sectionLabel) => {
    setEditingSection(sectionId);
    setInterventionMode(true);
    
    // Set a temporary "step" to handle the edit input
    setPreInterventionStep({
        id: `edit_${sectionId}`,
        field: sectionId === "header" ? "fullName" : sectionId, // Simple mapping
        next: currentStepId // Return to where we were
    });

    setHistory(prev => [...prev, { 
        role: "bot", 
        content: `I see you want to update your ${sectionLabel}. What would you like to change?`,
        type: "message" 
    }]);
  };

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
    if (!currentStep || isAiMode || interventionMode || editingSection) return;

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
  }, [currentStepId, isAiMode, interventionMode, editingSection]);

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

    // --- INTERVENTION MODE (Editing or correcting) ---
    if (interventionMode) {
        if (editingSection) {
            // Logic to update the specific section based on user input
            // For MVP, we just append or replace based on simple heuristics or direct update
            // Real AI would parse "Change my email to x"
            
            // Simple MVP handling:
            if (editingSection === "header") {
                // Determine if it looks like email or phone
                if (currentInput.includes("@")) setAnswers(prev => ({ ...prev, email: currentInput }));
                else if (currentInput.match(/\d{3}/)) setAnswers(prev => ({ ...prev, phone: currentInput }));
                else setAnswers(prev => ({ ...prev, fullName: currentInput }));
            } else if (editingSection === "summary") {
                setAnswers(prev => ({ ...prev, summary: currentInput }));
            }
            
            setHistory(prev => [...prev, { role: "bot", content: "Got it, I've updated that section for you. Anything else?" }]);
            setEditingSection(null); // Exit edit mode
            setInterventionMode(false);
            return;
        }

        // Normal intervention (from supervisor logic)
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

  return (
    <>
      <LandingPage />

      {/* Render Consent Overlay */}
      {showConsent && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1300,
            bgcolor: "rgba(18, 18, 18, 0.98)", // High opacity to focus on start
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1e1e 0%, #121212 100%)'
          }}
        >
          <Paper
            elevation={10}
            sx={{
              maxWidth: 500,
              width: "100%",
              p: 4,
              bgcolor: "rgba(30,30,30,0.9)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              textAlign: "center",
              border: "1px solid #333",
              borderRadius: 4
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#fdbb2d" }}>
              Easy CV Wizard
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: "#ccc", lineHeight: 1.6 }}>
              Let's build your resume through a quick chat. No forms, just conversation.
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
                    content: "Hi there! I'm your resume assistant. I'll help you build a professional resume step-by-step. Let's start with your contact info.", 
                    type: "message" 
                  }]);
                }}
                sx={{ py: 1.5, fontWeight: "bold" }}
              >
                Start Conversation
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                onClick={() => navigate("/signup")}
              >
                Skip to Dashboard
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Minimized State (FAB) */}
      {!showConsent && isMinimized && (
        <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
          <Fab color="secondary" variant="extended" onClick={() => setIsMinimized(false)}>
            <AiIcon sx={{ mr: 1 }} /> Resume Chat
          </Fab>
        </Box>
      )}

      {/* Floating Window Layout (Main Chat) */}
      {!showConsent && !isMinimized && (
        <Box sx={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          width: "100vw", 
          height: "100vh", 
          bgcolor: "rgba(0,0,0,0.7)", 
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
            <Fade in={true}>
                <Paper 
                    elevation={24}
                    sx={{
                        width: "90vw",
                        maxWidth: "1400px",
                        height: "85vh",
                        bgcolor: "#1e1e1e",
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        border: "1px solid #333"
                    }}
                >
                    {/* Window Header */}
                    <Box sx={{ 
                        px: 2, py: 1.5, 
                        bgcolor: "#252525", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        borderBottom: "1px solid #333" 
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: "#fdbb2d" }}>
                                <AiIcon sx={{ fontSize: 16, color: "#000" }} />
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: "bold" }}>
                                Easy CV Builder
                            </Typography>
                            {editingSection && <Chip label="Editing Mode" size="small" color="primary" />}
                        </Stack>
                        
                        <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={() => setIsMinimized(true)} sx={{ color: "#aaa" }}>
                                <MinimizeIcon fontSize="small" />
                            </IconButton>
                            <Button 
                                startIcon={<SaveIcon />} 
                                size="small" 
                                variant="text" 
                                color="inherit"
                                onClick={() => setShowSaveDialog(true)}
                                sx={{ color: "#aaa", mx: 1 }}
                            >
                                Save
                            </Button>
                            <IconButton size="small" onClick={() => navigate("/")} sx={{ color: "#aaa", "&:hover": { color: "#f44336" } }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Main Content Split */}
                    <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
                        
                        {/* Left Panel: Chat (40%) */}
                        <Box sx={{ 
                            width: { xs: "100%", md: "40%" }, 
                            display: "flex", 
                            flexDirection: "column", 
                            borderRight: "1px solid #333",
                            bgcolor: "#121212"
                        }}>
                            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                                {history.map((msg, index) => (
                                    <Zoom in={true} key={index} style={{ transitionDelay: `${index * 50}ms` }}>
                                        <Box
                                            sx={{
                                                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                                maxWidth: "90%",
                                            }}
                                        >
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 3,
                                                    bgcolor: msg.role === "user" ? "#fdbb2d" : "#2d2d2d",
                                                    color: msg.role === "user" ? "#000" : "#fff",
                                                    borderTopLeftRadius: msg.role === "bot" ? 4 : 20,
                                                    borderTopRightRadius: msg.role === "user" ? 4 : 20,
                                                    borderBottomLeftRadius: 20,
                                                    borderBottomRightRadius: 20,
                                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                                                }}
                                            >
                                                {msg.title && (
                                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5, opacity: 0.8 }}>
                                                        {msg.title}
                                                    </Typography>
                                                )}
                                                <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                                                    {msg.content}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    </Zoom>
                                ))}
                                {isTyping && (
                                    <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1, mt: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: "transparent" }}>
                                            <AiIcon sx={{ fontSize: 16, color: "#666" }} />
                                        </Avatar>
                                        <Typography variant="caption" sx={{ color: "#666", fontStyle: "italic", mt: 0.5 }}>
                                            AI is thinking...
                                        </Typography>
                                    </Box>
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Input Area */}
                            <Box sx={{ p: 2, borderTop: "1px solid #333", bgcolor: "#1e1e1e" }}>
                                {!isTyping && currentStep?.options && !isAiMode && !interventionMode && (
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

                                {(!currentStep?.options || isAiMode || interventionMode) && (
                                    <form onSubmit={handleInputSubmit} style={{ display: "flex", gap: 10 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            placeholder={
                                                interventionMode ? "Type your correction..." :
                                                isAiMode ? "Type your response..." : 
                                                (currentStep?.placeholder || "Type your answer...")
                                            }
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            disabled={isTyping}
                                            autoFocus
                                            sx={{
                                                bgcolor: "#2d2d2d",
                                                borderRadius: 2,
                                                "& .MuiOutlinedInput-root": { 
                                                    color: "#fff",
                                                    "& fieldset": { borderColor: "transparent" },
                                                    "&:hover fieldset": { borderColor: "#444" },
                                                    "&.Mui-focused fieldset": { borderColor: "#fdbb2d" },
                                                }
                                            }}
                                        />
                                        <IconButton 
                                            type="submit" 
                                            sx={{ 
                                                bgcolor: inputValue.trim() ? "#fdbb2d" : "#333", 
                                                color: inputValue.trim() ? "#000" : "#666",
                                                "&:hover": { bgcolor: inputValue.trim() ? "#e0a825" : "#333" }
                                            }}
                                            disabled={!inputValue.trim() || isTyping}
                                        >
                                            <SendIcon />
                                        </IconButton>
                                    </form>
                                )}
                            </Box>
                        </Box>

                        {/* Right Panel: Preview (60%) */}
                        <Box sx={{ 
                            flex: 1, 
                            display: { xs: "none", md: "block" },
                            bgcolor: "#525659",
                            overflow: "hidden"
                        }}>
                            <LiveResumePreview answers={answers} onEditSection={handleSectionEdit} />
                        </Box>

                    </Box>
                </Paper>
            </Fade>

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
      )}
    </>
  );
}

export default EasyCvWizard;