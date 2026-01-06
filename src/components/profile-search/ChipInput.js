import React from 'react';
import { 
  Autocomplete, 
  TextField, 
  Chip, 
  Box, 
  Typography,
  createFilterOptions
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Add as AddIcon, 
  Lightbulb as IdeaIcon 
} from '@mui/icons-material';

const filter = createFilterOptions();

export default function ChipInput({ 
  value, 
  onChange, 
  onInputChange,
  options, 
  placeholder 
}) {
  return (
    <Autocomplete
      multiple
      freeSolo
      value={value}
      onInputChange={onInputChange}
      onChange={(event, newValue) => {
        // Handle "Add 'query'" option
        const validValues = newValue.map(item => {
          if (typeof item === 'string') {
            return {
              label: item,
              value: item,
              type: 'text',
              source: 'Suggested'
            };
          }
          if (item.inputValue) {
             return {
              label: item.inputValue,
              value: item.inputValue,
              type: 'text',
              source: 'Suggested'
            };
          }
          return item;
        });
        onChange(validValues);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => inputValue === option.label);
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            label: `Search for "${inputValue}"`,
            type: 'text',
            source: 'Suggested',
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
        let BadgeIcon = IdeaIcon;
        let badgeColor = 'info.main';
        let badgeText = 'Suggested';

        if (option.source === 'Existing') {
          BadgeIcon = CheckIcon;
          badgeColor = 'success.main';
          badgeText = 'Existing';
        } else if (option.source === 'Not added') {
          BadgeIcon = AddIcon;
          badgeColor = 'warning.main';
          badgeText = 'Not added';
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
              {...tagProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={placeholder}
          fullWidth
        />
      )}
    />
  );
}
