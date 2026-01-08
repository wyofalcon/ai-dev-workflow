import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip,
  Collapse,
  InputBase,
  alpha
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Close as CloseIcon, 
  Info as InfoIcon,
  AutoAwesome as SparklesIcon 
} from '@mui/icons-material';
import ChipInput from './ChipInput.js';
import ResultsList from './ResultsList.js';
import DependencyModal from './DependencyModal.js';

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

export default function UserProfileSearch({
  allSections,
  profileData,
  sectionData,
  enabledSections,
  onOpenDialog,
  onAddSection,
  onScrollToSection
}) {
  const [queryChips, setQueryChips] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, 200);
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);

  const [results, setResults] = useState([]);
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

  // 1. Build the Search Index (Schema + Data)
  const searchIndex = useMemo(() => {
    const index = [];

    // --- Contact Section (Flat Data) ---
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
        status: f.value ? 'Saved' : 'Missing',
        data: null
      });
    });

    // --- List Sections (Arrays) ---
    Object.keys(sectionData).forEach(key => {
        const sectionConfig = allSections[key];
        if (!sectionConfig) return;

        const items = sectionData[key] || [];

        index.push({
            id: `add_${key}`,
            label: `Add ${sectionConfig.label}`,
            value: '',
            sectionId: key,
            sectionLabel: sectionConfig.label,
            type: 'action',
            status: 'New Suggestion',
            isList: true
        });

        items.forEach((item, idx) => {
            let label = item.name || item.title || item.institution || item.organization || item.language || 'Item';
            let detail = item.company || item.degree || item.role || item.proficiency || '';
            
            if (typeof item === 'string') {
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
                index: idx
            });
        });
    });

    return index;
  }, [allSections, profileData, sectionData]);

  // 2. Search Logic
  useEffect(() => {
    if (queryChips.length === 0 && !debouncedInput) {
      setResults([]);
      return;
    }

    const queryTokens = [
      ...queryChips.map(c => (typeof c === 'string' ? c : c.label).toLowerCase()),
      debouncedInput.toLowerCase()
    ].filter(Boolean);

    if (queryTokens.length === 0) {
        setResults([]);
        return;
    }

    const matches = searchIndex.filter(item => {
      const text = `${item.label} ${item.value} ${item.sectionLabel}`.toLowerCase();
      return queryTokens.some(token => text.includes(token));
    });

    matches.sort((a, b) => {
        const input = queryTokens[0] || '';
        const aExact = a.label.toLowerCase() === input;
        const bExact = b.label.toLowerCase() === input;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        if (a.status === 'Saved' && b.status !== 'Saved') return -1;
        if (a.status !== 'Saved' && b.status === 'Saved') return 1;

        return 0;
    });

    setResults(matches.slice(0, 20));
  }, [debouncedInput, queryChips, searchIndex]);


  // 3. Handle Selection
  const handleSelect = (item) => {
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
    setIsExpanded(false); // Close after selection
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

  const autocompleteOptions = useMemo(() => {
     const options = [];
     Object.keys(allSections).forEach(key => {
         const section = allSections[key];
         if (!enabledSections.includes(key) && !section.alwaysShow) {
             options.push({
                 label: section.label,
                 value: key,
                 type: 'section',
                 source: 'Not added'
             });
         }
     });
     if (sectionData.skills) {
         sectionData.skills.forEach(skill => {
             options.push({
                 label: skill,
                 value: skill,
                 type: 'value',
                 source: 'Existing'
             });
         });
     }
     return options;
  }, [allSections, enabledSections, sectionData]);


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
          <SparklesIcon color="primary" fontSize="small" />
        </IconButton>
        
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ChipInput
                value={queryChips}
                onChange={(newChips) => setQueryChips(newChips)}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                    if (!isExpanded && (newInputValue || queryChips.length > 0)) {
                        setIsExpanded(true);
                    }
                }}
                onFocus={() => {
                    if (inputValue || queryChips.length > 0) {
                        setIsExpanded(true);
                    }
                }}
                options={autocompleteOptions}
                placeholder="Smart Search..."
                variant="standard"
                sx={{ width: '100%', border: 'none', '& fieldset': { border: 'none' } }}
            />
        </Box>

        <Tooltip title="Smart Search: Find and edit any part of your profile instantly. Try searching for 'Skills', 'Education', or specific values like 'React'.">
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
            <ResultsList results={results} onSelect={handleSelect} />
            {results.length === 0 && (inputValue || queryChips.length > 0) && (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">No matching profile items found.</Typography>
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