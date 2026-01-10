import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AiIcon,
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Memory as ChipIcon,
  Minimize as MinimizeIcon,
  OpenInFull as ExpandIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';

// Questions mapped to profile sections
const SECTION_QUESTIONS = {
  workExperience: [
    "Can you share a story about a challenging project you completed?",
    "What measurable impact did you have in your last role? (e.g., increased sales by 20%)",
    "Describe a situation where you had to work with others to achieve a goal. What was your role?"
  ],
  skills: [
    "What tools or technologies have you mastered recently?",
    "What technical skills are you most proficient in?",
    "Are there any soft skills (like leadership or communication) you've developed?"
  ],
  summary: [
    "How would you describe your professional brand in 2-3 sentences?",
    "What are your unique strengths that set you apart from others?",
    "What is your ultimate career goal?"
  ],
  projects: [
    "Tell me about a project you're really proud of. What problem did it solve?",
    "What technologies did you use in your most recent project?",
    "Did you face any major roadblocks in a project? How did you overcome them?"
  ],
  education: [
    "What were your key achievements during your studies?",
    "Did you complete any capstone projects or thesis work?",
    "What relevant coursework have you completed?"
  ],
  default: [
    "What else would you like to add to your profile?",
    "Is there any other experience you think is important to highlight?"
  ]
};

const SYSTEM_PROMPT = `You are an expert resume writer and career coach for CVstomize. 
Your goal is to help users discover hidden skills and articulate their experience. 
1. Ask follow-up questions to dig deeper into their stories.
2. If they provide a specific accomplishment, suggest how to phrase it as a resume bullet point (Action Verb + Task + Result).
3. Be concise, encouraging, and professional.
4. If you identify a clear skill or resume entry, explicitly mention it prefixed with "EXTRACTED:".`;

export default function AiAssistPanel({
  open,
  onClose,
  activeSection,
  onUpdateProfile
}) {
  const { 
    isReady, 
    isLoading, 
    progress, 
    initializeModel, 
    generate, 
    resetChat 
  } = useWebLlm();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [extractionModal, setExtractionModal] = useState({ open: false, data: null, section: null });
  const messagesEndRef = useRef(null);

  // Initialize chat when panel opens or section changes
  useEffect(() => {
    if (open && isReady) {
      if (messages.length === 0) {
        const sectionKey = SECTION_QUESTIONS[activeSection] ? activeSection : 'default';
        const questions = SECTION_QUESTIONS[sectionKey];
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        setMessages([
          {
            role: 'assistant',
            content: `I can help you flesh out your ${activeSection === 'default' ? 'profile' : activeSection} section. ${randomQuestion}`
          }
        ]);
      }
    }
  }, [open, activeSection, isReady]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = { role: 'user', content: inputText };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInputText("");

    // Add placeholder for AI response
    setMessages(prev => [...prev, { role: 'assistant', content: "..." }]);

    const fullHistory = [
        { role: "system", content: SYSTEM_PROMPT },
        ...newHistory
    ];

    generate(
        fullHistory,
        (delta) => {
            // Update the last message (AI placeholder)
            setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.content === "...") lastMsg.content = ""; // Clear placeholder on first chunk
                lastMsg.content += delta;
                return updated;
            });
        },
        (finalText) => {
            // Check for extractions
            if (finalText.includes("EXTRACTED:")) {
                const parts = finalText.split("EXTRACTED:");
                if (parts[1]) {
                    const extractedContent = parts[1].trim().split('\n')[0]; // Take the first line after marker
                     setExtractionModal({
                        open: true,
                        data: extractedContent,
                        section: activeSection
                     });
                }
            }
        },
        (err) => {
            setMessages(prev => [...prev, { role: 'system', content: `Error: ${err}` }]);
        }
    );
  };

  const handleConfirmExtraction = (finalValue) => {
    onUpdateProfile(activeSection, finalValue);
    setExtractionModal({ open: false, data: null, section: null });
    
    // Add a system note that it was saved
    setMessages(prev => [...prev, {
      role: 'system',
      content: "✅ Information saved to your profile."
    }]);
  };

  if (!open) return null;

  const renderContent = () => {
    if (!isReady) {
      return (
        <Box sx={{ 
            height: '400px', 
            display: 'flex',
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 3, 
            textAlign: 'center',
            bgcolor: 'background.paper'
        }}>
          <ChipIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.primary">
            Download AI Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            To protect your privacy, we run the AI directly in your browser. 
            This requires a one-time download (~2GB).
          </Typography>
          
          {isLoading ? (
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={(progress?.progress || 0) * 100} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {localStorage.getItem("cvstomize_llm_cached") === "true" 
                    ? "Restoring AI from cache..." 
                    : (progress?.text || "Initializing...")}
              </Typography>
            </Box>
          ) : (
            <Button 
                variant="contained" 
                startIcon={<DownloadIcon />} 
                onClick={() => initializeModel()}
            >
                Download & Start AI
            </Button>
          )}
          
          {isLoading && (
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left', fontSize: '0.8rem' }}>
                Please keep this tab open. This usually takes 1-3 minutes depending on your internet connection.
            </Alert>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: 'background.default' }}>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mb: 2 }}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%' }} />
                AI is running locally on your device
            </Box>
          </Typography>

          {messages.map((msg, index) => (
            msg.role !== 'system' && (
                <Box 
                key={index} 
                sx={{ 
                    display: 'flex', 
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2 
                }}
                >
                {msg.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, mr: 1 }}>
                    <AiIcon fontSize="small" />
                    </Avatar>
                )}
                <Paper 
                    sx={{ 
                    p: 2, 
                    maxWidth: '85%', 
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    boxShadow: 1
                    }}
                >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{msg.content}</Typography>
                </Paper>
                </Box>
            )
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type your answer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              multiline
              maxRows={3}
              sx={{ bgcolor: 'background.default' }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: { xs: '100%', sm: 400 },
          maxHeight: '80vh',
          zIndex: 1200, // Above normal content but below standard Dialogs
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 1.5, 
          borderBottom: isMinimized ? 0 : 1, 
          borderColor: 'divider', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SparklesIcon />
            <Typography variant="subtitle1" fontWeight="bold">AI Assist</Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} color="inherit">
               {isMinimized ? <ExpandIcon /> : <MinimizeIcon />}
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClose(); }} color="inherit">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={!isMinimized} timeout="auto" unmountOnExit={false}>
            {renderContent()}
        </Collapse>
      </Paper>

      {/* Confirmation Modal */}
      <ExtractionConfirmationModal
        open={extractionModal.open}
        data={extractionModal.data}
        section={extractionModal.section}
        onClose={() => setExtractionModal({ open: false, data: null, section: null })}
        onConfirm={handleConfirmExtraction}
      />
    </>
  );
}

function ExtractionConfirmationModal({ open, data, section, onClose, onConfirm }) {
  const [editedData, setEditedData] = useState(data);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  const handleApprove = () => {
    onConfirm(editedData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SparklesIcon color="primary" />
        New Information Found
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
          I found some new information for your <strong>{section}</strong> section. 
          Please review it before adding.
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom color="primary.main" sx={{ fontWeight: 'bold' }}>
              Proposed Value:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={editedData}
                onChange={(e) => setEditedData(e.target.value)}
                autoFocus
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                {editedData}
              </Typography>
            )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {isEditing ? (
            <Button onClick={() => setIsEditing(false)} variant="outlined">Done Editing</Button>
        ) : (
            <Button onClick={() => setIsEditing(true)} startIcon={<EditIcon />}>Edit</Button>
        )}
        <Button onClick={handleApprove} variant="contained" startIcon={<CheckIcon />}>
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
}