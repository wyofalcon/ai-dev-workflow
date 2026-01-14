import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Fade,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AiIcon,
  Person as UserIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'intro', label: 'Introduction' },
  { id: 'contact', label: 'Contact Info' },
  { id: 'work', label: 'Work Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'summary', label: 'Summary' },
  { id: 'finish', label: 'Finish' }
];

const SYSTEM_PROMPT = `You are a friendly expert resume builder. 
Your goal is to interview the user to build their resume from scratch.
Be concise. Ask one question at a time.
If the user provides a company name, university, or location, try to extract it clearly.
If you need specific details like address or phone for an employer, ask for them, but mention we can look it up.
Current Step: {{STEP}}
`;

export default function ConversationalOnboarding() {
  const { isReady, generate, initializeModel, isLoading: isModelLoading } = useWebLlm();
  const { createAuthAxios } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Data collection state
  const [resumeData, setResumeData] = useState({
    fullName: "",
    phone: "",
    location: "",
    workExperience: [],
    education: [],
    skills: [],
    summary: ""
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, searchResults]);

  // Initial greeting
  useEffect(() => {
    if (isReady && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm here to help you build a professional resume from scratch. To start, what is your full name?"
        }
      ]);
    } else if (!isReady && !isModelLoading) {
        initializeModel();
    }
  }, [isReady, isModelLoading, messages.length, initializeModel]);

  const handleSearch = async (query) => {
    setIsSearching(true);
    try {
      const axios = await createAuthAxios();
      const response = await axios.get('/search/company', { params: { query } });
      
      if (response.data.items && response.data.items.length > 0) {
        setSearchResults({
            query,
            items: response.data.items.map(item => ({
                title: item.title,
                snippet: item.snippet,
                link: item.link
            }))
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputText("");
    setSearchResults(null);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: userText });
    
    const currentStep = STEPS[currentStepIndex];
    const currentSystemPrompt = `${SYSTEM_PROMPT.replace('{{STEP}}', currentStep.label)}
    If the user mentions a specific company or school name and you think searching for their address/phone would be helpful, 
    start your response with "SEARCH: [Query]".
    
    If you have gathered enough information for the current section (${currentStep.label}), 
    provide a brief summary of what you found and then move to the next section.
    
    Current Data: ${JSON.stringify(resumeData)}
    `;
    
    setMessages(prev => [...prev, { role: 'assistant', content: "..." }]);

    generate(
      [{ role: 'system', content: currentSystemPrompt }, ...history],
      (delta) => {
        setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.content === "...") lastMsg.content = "";
            lastMsg.content += delta;
            return updated;
        });
      },
      async (finalText) => {
         // Check for SEARCH trigger
         if (finalText.startsWith("SEARCH:")) {
            const query = finalText.replace("SEARCH:", "").split('\n')[0].trim();
            handleSearch(query);
         }

         // Extract data using a hidden LLM call or just update state based on current step
         updateResumeData(currentStep.id, userText);
         
         // Auto-advance logic (can be made smarter)
         if (finalText.toLowerCase().includes("next") || finalText.toLowerCase().includes("move on")) {
             if (currentStepIndex < STEPS.length - 1) {
                 setCurrentStepIndex(prev => prev + 1);
             }
         }
      },
      (error) => {
         setMessages(prev => [...prev, { role: 'system', content: `Error: ${error}` }]);
      }
    );
  };

  const updateResumeData = (stepId, text) => {
      setResumeData(prev => {
          const newData = { ...prev };
          if (stepId === 'intro' || stepId === 'contact') {
              if (text.includes('@')) newData.email = text; // naive
              else if (text.match(/\d/)) newData.phone = text; // naive
              else newData.fullName = text;
          } else if (stepId === 'summary') {
              newData.summary = text;
          } else if (stepId === 'skills') {
              newData.skills = [...new Set([...newData.skills, ...text.split(',').map(s => s.trim())])];
          }
          // Note: Work and Education usually need more complex parsing
          return newData;
      });
  };

  const handleSaveAndFinish = async () => {
    setIsFinishing(true);
    try {
        const axios = await createAuthAxios();
        await axios.post('/profile', {
            fullName: resumeData.fullName,
            phone: resumeData.phone,
            location: resumeData.location,
            skills: resumeData.skills,
            completeOnboarding: true,
            workPreferences: {
                summary: resumeData.summary,
                workExperience: resumeData.workExperience,
                education: resumeData.education
            }
        });
        navigate('/dashboard');
    } catch (error) {
        console.error("Failed to save profile:", error);
        alert("Failed to save profile. Please try again.");
    } finally {
        setIsFinishing(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setMessages(prev => [...prev, { 
        role: 'user', 
        content: `Details for ${searchResults.query}: ${result.snippet}` 
    }]);
    setSearchResults(null);
    
    // Manually update data or let AI handle next turn
    if (currentStepIndex === 2) { // Work
        setResumeData(prev => ({
            ...prev,
            workExperience: [...prev.workExperience, { company: searchResults.query, description: result.snippet, current: true }]
        }));
    }
  };

  if (!isReady) {
     return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Initializing AI Assistant...</Typography>
        </Box>
     );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Resume Builder AI</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
            {STEPS.map((step, idx) => (
                <Chip 
                    key={step.id} 
                    label={step.label} 
                    color={idx === currentStepIndex ? "primary" : "default"} 
                    variant={idx === currentStepIndex ? "filled" : "outlined"}
                    size="small"
                />
            ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
            {currentStepIndex === STEPS.length - 1 && (
                <Button 
                    variant="contained" 
                    color="success" 
                    onClick={handleSaveAndFinish}
                    disabled={isFinishing}
                    startIcon={isFinishing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                >
                    Save & Finish
                </Button>
            )}
            <Button onClick={() => navigate('/dashboard')}>Exit</Button>
        </Box>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}><AiIcon /></Avatar>
                )}
                <Paper sx={{ 
                    p: 2, 
                    maxWidth: '70%', 
                    bgcolor: msg.role === 'user' ? '#e3f2fd' : 'white',
                    borderRadius: 2
                }}>
                    <Typography variant="body1">{msg.content}</Typography>
                </Paper>
                {msg.role === 'user' && (
                    <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}><UserIcon /></Avatar>
                )}
            </Box>
        ))}
        
        {/* Search Results Area */}
        {isSearching && (
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', ml: 6 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Searching web for details...</Typography>
             </Box>
        )}

        {searchResults && (
            <Fade in={true}>
                <Paper sx={{ ml: 6, maxWidth: '70%', p: 2, border: '1px solid #ddd' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SearchIcon fontSize="small" color="primary" />
                        Found details for "{searchResults.query}":
                    </Typography>
                    <List dense>
                        {searchResults.items.map((item, i) => (
                            <ListItemButton key={i} onClick={() => handleSelectSearchResult(item)} sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}>
                                <ListItemIcon>
                                    <BusinessIcon color="action" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.title} 
                                    secondary={item.snippet}
                                    primaryTypographyProps={{ variant: 'subtitle2', color: 'primary' }}
                                    secondaryTypographyProps={{ variant: 'caption', noWrap: false, display: 'block' }}
                                />
                                <AddIcon color="action" />
                            </ListItemButton>
                        ))}
                    </List>
                    <Typography variant="caption" color="text.secondary">
                        Click an item to add these details to your resume automatically.
                    </Typography>
                </Paper>
            </Fade>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, maxWidth: 'md', mx: 'auto' }}>
            <TextField 
                fullWidth 
                placeholder="Type your answer..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                autoFocus
            />
            <Button 
                variant="contained" 
                endIcon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
            >
                Send
            </Button>
        </Box>
      </Paper>
    </Box>
  );
}
