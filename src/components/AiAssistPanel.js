import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
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
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AiIcon,
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

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

export default function AiAssistPanel({ 
  open, 
  onClose, 
  activeSection, 
  onUpdateProfile 
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [extractionModal, setExtractionModal] = useState({ open: false, data: null, section: null });
  const messagesEndRef = useRef(null);

  // Initialize chat when panel opens or section changes
  useEffect(() => {
    if (open) {
      const sectionKey = SECTION_QUESTIONS[activeSection] ? activeSection : 'default';
      const questions = SECTION_QUESTIONS[sectionKey];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: `I can help you flesh out your ${activeSection === 'default' ? 'profile' : activeSection} section.`
        },
        {
          id: 'q1',
          role: 'ai',
          text: randomQuestion
        }
      ]);
    }
  }, [open, activeSection]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      setIsTyping(false);
      handleAiResponse(userMsg.text);
    }, 1500);
  };

  const handleAiResponse = (userResponse) => {
    // 1. Identify potential information to extract
    // For this prototype, we treat the entire user response as the "value" 
    // but in a real app, this would be an API call to an LLM extractor.
    const extractedValue = userResponse; 
    
    // 2. Open confirmation modal
    setExtractionModal({
      open: true,
      data: extractedValue,
      section: activeSection
    });
  };

  const handleConfirmExtraction = (finalValue) => {
    // 3. Update profile
    onUpdateProfile(activeSection, finalValue);
    
    setExtractionModal({ open: false, data: null, section: null });
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'ai',
      text: "Great! I've added that to your profile. Is there anything else you'd like to include?"
    }]);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SparklesIcon />
            <Typography variant="h6">AI Assist</Typography>
          </Box>
          <IconButton onClick={onClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: 'grey.50' }}>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mb: 2 }}>
            Don’t exaggerate—focus on real experiences. Dig deep and think of stories that show your strengths.
          </Typography>

          {messages.map((msg) => (
            <Box 
              key={msg.id} 
              sx={{ 
                display: 'flex', 
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2 
              }}
            >
              {msg.role === 'ai' && (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                  <AiIcon fontSize="small" />
                </Avatar>
              )}
              <Paper 
                sx={{ 
                  p: 2, 
                  maxWidth: '80%', 
                  bgcolor: msg.role === 'user' ? 'primary.light' : 'white',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
            </Box>
          ))}
          
          {isTyping && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                <AiIcon fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  <Box sx={{ width: 6, height: 6, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }} />
                  <Box sx={{ width: 6, height: 6, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }} />
                </Box>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
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
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

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
        <Typography variant="body2" color="text.secondary" gutterBottom>
          I found some new information for your <strong>{section}</strong> section. 
          Please review it before adding.
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
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
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
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
