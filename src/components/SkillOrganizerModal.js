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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Paper
} from '@mui/material';
import {
  AutoAwesome as SparklesIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';

export default function SkillOrganizerModal({ 
  open, 
  onClose, 
  skills, 
  onSave 
}) {
  const { isReady, generate } = useWebLlm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedSkills, setOrganizedSkills] = useState({});
  const [topSkills, setTopSkills] = useState([]);
  const [error, setError] = useState("");

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setOrganizedSkills({});
      setTopSkills([]);
      setError("");
      setIsProcessing(true);
      
      if (isReady && skills.length > 0) {
        organizeSkillsWithAI();
      } else {
        // Fallback or wait
        setIsProcessing(false);
      }
    }
  }, [open, isReady]);

  const organizeSkillsWithAI = async () => {
    const prompt = `
    You are an expert resume optimizer. 
    Analyze the following list of skills and group them into logical professional categories (e.g., "Languages", "Frameworks", "Tools", "Soft Skills", etc.).
    Also, identify the 5 most high-impact/marketable skills from this list that should be highlighted as "Top Skills".
    
    Return ONLY a valid JSON object with this structure:
    {
        "categories": {
            "Category Name 1": ["Skill A", "Skill B"],
            "Category Name 2": ["Skill C", "Skill D"]
        },
        "topSkills": ["Skill A", "Skill C"]
    }

    Skills List: ${skills.join(", ")}
    `;

    generate(
        [{ role: 'user', content: prompt }],
        () => {}, // streaming update not needed for this
        (finalText) => {
            try {
                // Extract JSON
                const jsonMatch = finalText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    setOrganizedSkills(result.categories || {});
                    setTopSkills(result.topSkills || []);
                } else {
                    throw new Error("Failed to parse AI response");
                }
            } catch (err) {
                console.error("AI Organization Failed:", err);
                setError("Could not organize skills automatically. Please try again.");
            } finally {
                setIsProcessing(false);
            }
        },
        (err) => {
            setError(err);
            setIsProcessing(false);
        }
    );
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
