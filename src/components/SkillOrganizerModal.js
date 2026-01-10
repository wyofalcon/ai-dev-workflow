import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Paper
} from '@mui/material';
import {
  AutoAwesome as SparklesIcon,
  Check as CheckIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Cloud as CloudIcon,
  Memory as ChipIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';

export default function SkillOrganizerModal({ 
  open, 
  onClose, 
  skills, 
  onSave 
}) {
  const { organizeSkillsWithFallback, isReady } = useWebLlm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedSkills, setOrganizedSkills] = useState({});
  const [topSkills, setTopSkills] = useState([]);
  const [error, setError] = useState("");
  const [aiSource, setAiSource] = useState(null); // "local" or "server"

  // Reset state when opened
  useEffect(() => {
    if (open && skills.length > 0) {
      setOrganizedSkills({});
      setTopSkills([]);
      setError("");
      setAiSource(null);
      setIsProcessing(true);
      organizeSkillsWithAI();
    }
  }, [open]);

  const organizeSkillsWithAI = async () => {
    try {
      await organizeSkillsWithFallback(
        skills,
        (result) => {
          setOrganizedSkills(result.categories || {});
          setTopSkills(result.topSkills || []);
          setAiSource(result.source || (isReady ? "local" : "server"));
          setIsProcessing(false);
        },
        (err) => {
          console.error("AI Organization Failed:", err);
          setError("Could not organize skills automatically. Please try again.");
          setIsProcessing(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handleToggleTopSkill = (skill) => {
    if (topSkills.includes(skill)) {
      setTopSkills(prev => prev.filter(s => s !== skill));
    } else {
      if (topSkills.length >= 10) {
        alert("You can only select up to 10 top skills.");
        return;
      }
      setTopSkills(prev => [...prev, skill]);
    }
  };

  const handleSave = () => {
    // Flatten skills back to list if needed, or pass structured data
    // For now, we assume the parent component just wants the updated top skills preference
    // or maybe we re-order the main list based on this?
    // Let's pass back the organized structure + top skills
    onSave({ organized: organizedSkills, top: topSkills });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SparklesIcon color="primary" />
        AI Skill Organizer
        {aiSource && (
          <Chip 
            icon={aiSource === "local" ? <ChipIcon /> : <CloudIcon />}
            label={aiSource === "local" ? "Local AI" : "Server AI"}
            size="small"
            variant="outlined"
            color={aiSource === "local" ? "success" : "primary"}
            sx={{ ml: 'auto' }}
          />
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {isProcessing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Analyzing your skills portfolio...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
              The AI has categorized your skills. Select the <strong>Star icon</strong> next to skills you want to highlight as "Top Skills" (max 10).
            </Typography>

            {Object.entries(organizedSkills).map(([category, categorySkills]) => (
              <Paper key={category} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {category}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categorySkills.map(skill => (
                    <Chip
                      key={skill}
                      label={skill}
                      icon={topSkills.includes(skill) ? <StarIcon /> : <StarBorderIcon />}
                      onClick={() => handleToggleTopSkill(skill)}
                      color={topSkills.includes(skill) ? "secondary" : "default"}
                      variant={topSkills.includes(skill) ? "filled" : "outlined"}
                      clickable
                    />
                  ))}
                </Box>
              </Paper>
            ))}
            
            {Object.keys(organizedSkills).length === 0 && (
                <Typography>No categories found. Try adding more skills first.</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={isProcessing || Object.keys(organizedSkills).length === 0}
            startIcon={<CheckIcon />}
        >
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
