import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip,
  Collapse,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Info as InfoIcon, 
  AutoAwesome as SparklesIcon 
} from '@mui/icons-material';
import ChipInput from './ChipInput.js';
import ResultsList from './ResultsList.js';
import DependencyModal from './DependencyModal.js';
import onetSkillsData from '../../data/onet-skills.json';
import { useWebLlm } from '../../contexts/WebLlmContext.js';

// Helper to debounce search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ALL_SKILLS = onetSkillsData.skills || [];

export default function UserProfileSearch({
  allSections,
  profileData,
  sectionData,
  enabledSections,
  onOpenDialog,
  onAddSection,
  onScrollToSection,
  onToggleFavorite,
  favoriteSkills = [] // Expecting array of strings (skill names)
}) {
  const { generate, isReady: isLlmReady } = useWebLlm();
  const [queryChips, setQueryChips] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, 400); // Increased debounce for LLM safety
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);

  const [results, setResults] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [dependencyModal, setDependencyModal] = useState({
    open: false,
    sectionId: null,
    fieldId: null,
    fieldLabel: null,
    sectionLabel: null
  });

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // 1. Build the Static Profile Index
  const profileIndex = useMemo(() => {
    const index = [];

    // --- Contact Section ---
    const contactFields = [
      { id: 'fullName', label: 'Full Name', value: profileData.fullName },
      { id: 'currentTitle', label: 'Job Title', value: profileData.currentTitle },
      { id: 'email', label: 'Email', value: profileData.email },
      { id: 'phone', label: 'Phone', value: profileData.phone },
      { id: 'location', label: 'Location', value: profileData.location },
      { id: 'linkedinUrl', label: 'LinkedIn URL', value: profileData.linkedinUrl },
      { id: 'portfolioUrl', label: 'Portfolio URL', value: profileData.portfolioUrl },
      { id: 'githubUrl', label: 'GitHub URL', value: profileData.githubUrl },
      { id: 'summary', label: 'Professional Summary', value: profileData.summary, sectionId: 'summary' }
    ];

    contactFields.forEach(f => {
      const sectionId = f.sectionId || 'contact';
      index.push({
        id: f.id,
        label: f.label,
        value: f.value,
        sectionId: sectionId,
        sectionLabel: allSections[sectionId]?.label || 'Contact',
        type: 'field',
        status: f.value ? 'Saved' : 'Missing'
      });
    });

    // --- List Sections ---
    Object.keys(sectionData).forEach(key => {
        const sectionConfig = allSections[key];
        if (!sectionConfig) return;

        const items = sectionData[key] || [];

        // "Add New" action for every section
        index.push({
            id: `add_${key}`,
            label: `Add to ${sectionConfig.label}`,
            value: '',
            sectionId: key,
            sectionLabel: sectionConfig.label,
            type: 'action',
            status: 'New Suggestion'
        });

        items.forEach((item, idx) => {
            let label = item.name || item.title || item.institution || item.organization || item.language || 'Item';
            let detail = item.company || item.degree || item.role || item.proficiency || '';
            
            if (typeof item === 'string') { // Handling skills array
                label = item;
                detail = '';
            }

            index.push({
                id: `${key}_${idx}`,
                label: label,
                value: detail,
                sectionId: key,
                sectionLabel: sectionConfig.label,
                type: 'item',
                status: 'Saved',
                data: item,
                index: idx,
                isFavorite: key === 'skills' && favoriteSkills.includes(label)
            });
        });
    });

    return index;
  }, [allSections, profileData, sectionData, favoriteSkills]);

  // 2. AI Semantic Expansion
  useEffect(() => {
    if (!debouncedInput || debouncedInput.length < 3 || !isLlmReady) {
        setAiSuggestions([]);
        return;
    }

    // Only trigger if we don't have many direct matches? 
    // Or always trigger to find "hidden" skills?
    // Let's do a lightweight check: if it looks like a semantic query ("leadership skills", "coding")
    
    setIsAiLoading(true);
    const messages = [
      { 
        role: "system", 
        content: "You are a skill extraction assistant. Output a JSON array of 5 relevant O*NET skill names based on the user's query. Return ONLY the JSON array." 
      },
      { 
        role: "user", 
        content: `User Query: "${debouncedInput}"\nSuggest 5 specific professional skills related to this.` 
      }
    ];

    generate(
        messages,
        () => {}, // onUpdate
        (responseText) => {
            try {
                // Attempt to parse JSON
                const jsonMatch = responseText.match(/\[.*\]/s);
                if (jsonMatch) {
                    const skills = JSON.parse(jsonMatch[0]);
                    setAiSuggestions(skills);
                }
            } catch (e) {
                console.warn("Failed to parse AI skills", e);
            }
            setIsAiLoading(false);
        },
        (err) => {
            console.error(err);
            setIsAiLoading(false);
        }
    );
  }, [debouncedInput, isLlmReady, generate]);


  // 3. Master Search Logic
  useEffect(() => {
    // Determine active query
    const rawInput = inputValue.trim();
    if (!rawInput && queryChips.length === 0) {
      setResults([]);
      return;
    }

    const searchTerms = [
      ...queryChips.map(c => (typeof c === 'string' ? c : c.label).toLowerCase()),
      rawInput.toLowerCase()
    ].filter(Boolean);

    if (searchTerms.length === 0) {
        setResults([]);
        return;
    }

    const term = searchTerms[0]; // Primary search term

    // A. Profile Matches (High Priority)
    const profileMatches = profileIndex.filter(item => {
      const text = `${item.label} ${item.value} ${item.sectionLabel}`.toLowerCase();
      return text.includes(term);
    });

    // B. AI Suggestion Matches (Medium Priority)
    const aiMatches = [];
    if (aiSuggestions.length > 0) {
        aiSuggestions.forEach(suggestion => {
            // Check if this suggestion exists in our O*NET DB (fuzzy) or is valid
            // For now, we trust the AI but map it to our DB if possible
            const match = ALL_SKILLS.find(s => s.toLowerCase() === suggestion.toLowerCase());
            if (match && !sectionData.skills?.includes(match)) {
                aiMatches.push({
                    id: `ai_skill_${match}`,
                    label: match,
                    value: 'AI Suggested Skill',
                    sectionId: 'skills',
                    sectionLabel: 'Skills',
                    type: 'suggestion',
                    status: 'AI Suggestion',
                    data: match
                });
            }
        });
    }

    // C. O*NET Database Matches (Low Priority - Fillers)
    // Only search if we don't have tons of results matches
    const dbMatches = [];
    if (profileMatches.length < 10) {
        // Simple string inclusion for performance
        // Limit to top 15 matches to avoid UI lag
        let count = 0;
        for (const skill of ALL_SKILLS) {
            if (count > 15) break;
            // Exclude if already in profile or AI matches
            if (
                skill.toLowerCase().includes(term) && 
                !sectionData.skills?.includes(skill) &&
                !aiMatches.find(m => m.label === skill)
            ) {
                dbMatches.push({
                    id: `db_skill_${skill}`,
                    label: skill,
                    value: 'Database Skill',
                    sectionId: 'skills',
                    sectionLabel: 'Skills',
                    type: 'suggestion',
                    status: 'New Suggestion',
                    data: skill
                });
                count++;
            }
        }
    }

    // Combine
    const combined = [...profileMatches, ...aiMatches, ...dbMatches];
    setResults(combined);

  }, [inputValue, queryChips, profileIndex, aiSuggestions, sectionData.skills]);


  // Handle Selection
  const handleSelect = (item) => {
    if (item.type === 'suggestion') {
        // It's a new skill from DB or AI
        onAddSection('skills'); // Ensure section enabled
        // We need a way to add this specific skill. 
        // For now, we'll open the dialog pre-filled? 
        // OR better: directly add it if it's a skill?
        // Let's open the dialog for now to be safe, or trigger the "Add" flow.
        
        // Since the prompt asks to "use the database... to make it so we can rank/mark", 
        // we might just want to Add it to the profile immediately? 
        // Let's stick to the existing pattern: Open Dialog with data.
        onOpenDialog('skills', [item.label], -1); // -1 for new, but skills are array...
        // Actually skills dialog is usually a list editor. 
        // Let's just open the skills dialog.
        onOpenDialog('skills'); 
    } else {
        const isSectionEnabled = enabledSections.includes(item.sectionId);
        const isAlwaysShown = allSections[item.sectionId]?.alwaysShow;

        if (!isSectionEnabled && !isAlwaysShown) {
            setDependencyModal({
                open: true,
                sectionId: item.sectionId,
                fieldId: item.id,
                fieldLabel: item.label,
                sectionLabel: allSections[item.sectionId]?.label
            });
            return;
        }

        executeSelection(item);
    }
    setIsExpanded(false);
  };

  const executeSelection = (item) => {
    if (item.sectionId === 'contact' || item.sectionId === 'summary') {
        if (item.sectionId === 'summary') {
            onScrollToSection(item.sectionId);
        } else {
             onScrollToSection('contact');
        }
    } else {
        if (item.type === 'action') {
            onOpenDialog(item.sectionId);
        } else if (item.type === 'item') {
            onOpenDialog(item.sectionId, item.data, item.index);
        }
    }
  };

  const handleCreateAndAdd = () => {
    const { sectionId } = dependencyModal;
    onAddSection(sectionId);
    setDependencyModal({ ...dependencyModal, open: false });
    onOpenDialog(sectionId);
  };

  const handleCustomize = () => {
     const { sectionId } = dependencyModal;
     onAddSection(sectionId);
     onScrollToSection(sectionId);
     setDependencyModal({ ...dependencyModal, open: false });
  };

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
      {/* Compact Search Bar */}
      <Paper
        elevation={isExpanded ? 4 : 1}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2,
          border: '1px solid',
          borderColor: isExpanded ? 'primary.main' : 'divider',
          transition: 'all 0.2s',
          width: '100%'
        }}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search">
          <SparklesIcon color={isAiLoading ? "secondary" : "primary"} fontSize="small" />
        </IconButton>
        
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ChipInput
                value={queryChips}
                onChange={(newChips) => setQueryChips(newChips)}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                    if (!isExpanded && newInputValue.length > 0) {
                        setIsExpanded(true);
                    }
                }}
                onFocus={() => {
                    if (inputValue.length > 0) {
                        setIsExpanded(true);
                    }
                }}
                options={[]} // Disable default autocomplete options in favor of our smart results
                placeholder={isAiLoading ? "AI is thinking..." : "Type a skill (e.g. 'React') or section..."}
                variant="standard"
                sx={{ width: '100%', border: 'none', '& fieldset': { border: 'none' } }}
            />
        </Box>

        {isAiLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}

        <Tooltip title="Smart Search: Type to find profile sections or discover new skills from our database. AI will help suggest relevant skills.">
            <IconButton sx={{ p: '10px' }} aria-label="info">
                <InfoIcon fontSize="small" color="action" />
            </IconButton>
        </Tooltip>
      </Paper>

      {/* Expanded Results Area */}
      <Collapse in={isExpanded && (inputValue.length > 0 || queryChips.length > 0)}>
        <Paper 
            elevation={8} 
            sx={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                mt: 0.5, 
                zIndex: 1000,
                maxHeight: 400,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '0 0 8px 8px'
            }}
        >
            <ResultsList 
                results={results} 
                onSelect={handleSelect} 
                onToggleFavorite={onToggleFavorite}
            />
            {results.length === 0 && !isAiLoading && (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">No matching skills or sections found.</Typography>
                </Box>
            )}
        </Paper>
      </Collapse>

      <DependencyModal
        open={dependencyModal.open}
        onClose={() => setDependencyModal({ ...dependencyModal, open: false })}
        sectionName={dependencyModal.sectionLabel}
        fieldName={dependencyModal.fieldLabel}
        onCreateAndAdd={handleCreateAndAdd}
        onCustomize={handleCustomize}
      />
    </Box>
  );
}