import React, { useState, useEffect, useMemo } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Chip, 
  Box, 
  Typography,
  CircularProgress,
  createFilterOptions
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Add as AddIcon, 
  AutoAwesome as SparklesIcon 
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';
import onetSkillsData from '../data/onet-skills.json';

const filter = createFilterOptions();
const ALL_SKILLS = onetSkillsData.skills || [];

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

export default function SmartSkillInput({ 
  skills, 
  onSkillsChange, 
  placeholder = "Type a skill (e.g. 'React', 'Leadership')..." 
}) { 
  const { generate, isReady: isLlmReady } = useWebLlm();
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, 400);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [options, setOptions] = useState([]);

  // AI Semantic Expansion
  useEffect(() => {
    if (!debouncedInput || debouncedInput.length < 3 || !isLlmReady) {
        setAiSuggestions([]);
        return;
    }

    setIsAiLoading(true);
    const messages = [
      { 
        role: "system", 
        content: "You are a skill extraction assistant. Output a JSON array of 5 relevant O*NET skill names based on the user's query. Return ONLY the JSON array." 
      }, 
      {
        role: "user", 
        content: `User Query: "${debouncedInput}"
Suggest 5 specific professional skills related to this.` 
      }
    ];

    generate(
        messages,
        () => {}, // onUpdate
        (responseText) => {
            try {
                // Attempt to parse JSON
                const jsonMatch = responseText.match(/.*\[.*\]/s);
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

  // Merge Options: O*NET Matches + AI Suggestions
  useEffect(() => {
    const term = inputValue.toLowerCase();
    
    // 1. O*NET Database Matches
    // Limit to top 50 to avoid performance issues
    const dbMatches = [];
    if (term) {
        let count = 0;
        for (const skill of ALL_SKILLS) {
            if (count > 50) break;
            if (skill.toLowerCase().includes(term) && !skills.includes(skill)) {
                dbMatches.push({
                    label: skill,
                    type: 'database',
                    source: 'O*NET'
                });
                count++;
            }
        }
    }

    // 2. AI Suggestions
    const aiOptions = aiSuggestions
        .filter(s => !skills.includes(s))
        .map(s => ({
            label: s,
            type: 'ai',
            source: 'AI Suggestion'
        }));

    // Combine (AI first if available)
    setOptions([...aiOptions, ...dbMatches]);

  }, [inputValue, aiSuggestions, skills]);

  return (
    <Autocomplete
      multiple
      freeSolo
      value={skills}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        // newValue is array of strings (from freeSolo) or objects (from options)
        const newSkills = newValue.map(item => {
            if (typeof item === 'string') return item;
            if (item.inputValue) return item.inputValue; // From "Add 'xyz'"
            return item.label;
        });
        onSkillsChange(newSkills);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => inputValue === option.label);
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            label: `Add "${inputValue}"`, // Corrected escaping for double quotes within a string
            type: 'new',
            source: 'Custom',
          });
        }
        return filtered;
      }}
      options={options}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
        }
        // Regular option
        return option.label;
      }}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        let BadgeIcon = AddIcon;
        let badgeColor = 'action.disabled';
        let badgeText = 'Add';

        if (option.type === 'ai') {
          BadgeIcon = SparklesIcon;
          badgeColor = 'secondary.main';
          badgeText = 'AI Suggestion';
        } else if (option.type === 'database') {
            badgeText = 'O*NET';
        }

        return (
          <li key={key} {...otherProps}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography variant="body1">
                {option.label}
              </Typography>
              <Chip 
                size="small" 
                icon={<BadgeIcon fontSize="small" />} 
                label={badgeText} 
                variant="outlined"
                sx={{ 
                  ml: 2, 
                  borderColor: badgeColor, 
                  color: badgeColor,
                  '& .MuiChip-icon': { color: badgeColor }
                }} 
              />
            </Box>
          </li>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              variant="outlined"
              label={typeof option === 'string' ? option : option.label}
              color="primary"
              {...tagProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={skills.length === 0 ? placeholder : ""}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {isAiLoading ? <CircularProgress color="secondary" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}
