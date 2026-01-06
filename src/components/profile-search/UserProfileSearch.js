import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
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
  profileData, // Flat data (contact, summary)
  sectionData, // Lists (workExperience, education, etc.)
  enabledSections,
  onOpenDialog,
  onAddSection,
  onScrollToSection
}) {
  const [queryChips, setQueryChips] = useState([]);
  const [inputValue, setInputValue] = useState(''); // Current text input
  const debouncedInput = useDebounce(inputValue, 200);

  const [results, setResults] = useState([]);
  const [dependencyModal, setDependencyModal] = useState({
    open: false,
    sectionId: null,
    fieldId: null,
    fieldLabel: null,
    sectionLabel: null
  });

  // 1. Build the Search Index (Schema + Data)
  const searchIndex = useMemo(() => {
    const index = [];

    // --- Contact Section (Flat Data) ---
    // We map known contact fields manually or derived from profileData keys if possible.
    // Ideally this comes from a schema, but we'll infer/hardcode for this specific app structure.
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
        data: null // No complex data object for flat fields
      });
    });

    // --- List Sections (Arrays) ---
    // For each list section, we index the *fields* (e.g. "Add Work Experience") 
    // AND the *items* (e.g. "Software Engineer at Google").
    
    Object.keys(sectionData).forEach(key => {
        const sectionConfig = allSections[key];
        if (!sectionConfig) return;

        const items = sectionData[key] || [];

        // 1. Index the "Add New" capability for this section
        index.push({
            id: `add_${key}`,
            label: `Add ${sectionConfig.label}`, // e.g. "Add Work Experience"
            value: '',
            sectionId: key,
            sectionLabel: sectionConfig.label,
            type: 'action',
            status: 'New Suggestion',
            isList: true
        });

        // 2. Index existing items
        items.forEach((item, idx) => {
            let label = item.name || item.title || item.institution || item.organization || item.language || 'Item';
            let detail = item.company || item.degree || item.role || item.proficiency || '';
            
            // Special handling for chips (Skills, Interests) which are just strings
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
      // Simple AND logic: item must match at least one token (OR) or all? 
      // Requirement: "fielded queries... free text... partials"
      // Let's do simple partial match for now: if ANY token is found in the item.
      return queryTokens.some(token => text.includes(token));
    });

    // Ranking: Exact matches first, then startsWith, then includes
    // Also prioritize "Saved" items over "New Suggestion"
    matches.sort((a, b) => {
        // Prioritize exact label match
        const input = queryTokens[0] || '';
        const aExact = a.label.toLowerCase() === input;
        const bExact = b.label.toLowerCase() === input;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Prioritize existing items
        if (a.status === 'Saved' && b.status !== 'Saved') return -1;
        if (a.status !== 'Saved' && b.status === 'Saved') return 1;

        return 0;
    });

    setResults(matches.slice(0, 20)); // Limit to 20
  }, [debouncedInput, queryChips, searchIndex]);


  // 3. Handle Selection
  const handleSelect = (item) => {
    // Check dependency
    const isSectionEnabled = enabledSections.includes(item.sectionId);
    // Contact is always enabled, effectively.
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
  };

  const executeSelection = (item) => {
    if (item.sectionId === 'contact' || item.sectionId === 'summary') {
        // These are handled by scrolling to them or focusing (Contact is top, Summary is a section)
        if (item.sectionId === 'summary') {
            // Ensure summary is open/visible? 
            // In UserProfilePage, summary is a section.
            onScrollToSection(item.sectionId);
        } else {
             onScrollToSection('contact');
        }
        // Ideally we focus the field, but scrolling is a good start.
    } else {
        // List items or "Add New"
        if (item.type === 'action') {
            // "Add Work Experience"
            onOpenDialog(item.sectionId);
        } else if (item.type === 'item') {
            // Edit existing item
            onOpenDialog(item.sectionId, item.data, item.index);
        }
    }
  };

  const handleCreateAndAdd = () => {
    const { sectionId, fieldId } = dependencyModal;
    onAddSection(sectionId);
    setDependencyModal({ ...dependencyModal, open: false });
    
    // Find the item again to execute (it was the 'action' or 'field' user clicked)
    // We can just proceed with "Open Dialog" for that section since it's likely an "Add" action
    // If it was a specific field in a list (not possible for "New Suggestion" usually, but maybe schema field)
    onOpenDialog(sectionId);
  };

  const handleCustomize = () => {
     const { sectionId } = dependencyModal;
     onAddSection(sectionId);
     onScrollToSection(sectionId);
     setDependencyModal({ ...dependencyModal, open: false });
  };

  // 4. Autocomplete Options
  // Surface schema fields that aren't added yet + existing values
  const autocompleteOptions = useMemo(() => {
     const options = [];
     
     // Add known sections/actions that are MISSING
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

     // Add existing skills (as an example of deep search)
     // (Already covered by free text search, but good for autocomplete dropdown)
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
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Search Profile
        </Typography>
        <ChipInput
            value={queryChips}
            onChange={(newChips) => setQueryChips(newChips)}
            onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
            options={autocompleteOptions}
            placeholder="Search your profile—try ‘Skills’, ‘Certifications’, or ‘Location: Austin’"
        />
        <ResultsList results={results} onSelect={handleSelect} />
      </Paper>

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
