import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Chip, 
  Typography, 
  Paper, 
  Box,
  Divider,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as SavedIcon, 
  Warning as MissingIcon, 
  Lightbulb as SuggestionIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AutoAwesome as AiIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

export default function ResultsList({ results, onSelect, onToggleFavorite }) {
  if (!results || results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography variant="body1">
          No matches yet.
        </Typography>
      </Box>
    );
  }

  // Group by section
  const grouped = results.reduce((acc, item) => {
    const section = item.sectionLabel || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ mt: 2 }}>
      {Object.entries(grouped).map(([section, items]) => (
        <Paper key={section} sx={{ mb: 2, overflow: 'hidden' }} variant="outlined">
          <Box sx={{ bgcolor: 'action.hover', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
              {section}
            </Typography>
            {items.some(i => i.status === 'AI Suggestion') && (
                <Chip label="AI Powered" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
          </Box>
          <List disablePadding>
            {items.map((item, index) => {
              let StatusIcon = SuggestionIcon;
              let statusColor = 'info';
              let statusLabel = 'New Suggestion';

              if (item.status === 'Saved') {
                StatusIcon = SavedIcon;
                statusColor = 'success';
                statusLabel = 'Saved';
              } else if (item.status === 'Missing') {
                StatusIcon = MissingIcon;
                statusColor = 'warning';
                statusLabel = 'Missing';
              } else if (item.status === 'AI Suggestion') {
                StatusIcon = AiIcon;
                statusColor = 'secondary';
                statusLabel = 'AI Suggestion';
              }

              const isSkill = item.sectionId === 'skills';

              return (
                <React.Fragment key={item.id}>
                  {index > 0 && <Divider />}
                  <ListItem 
                    button 
                    onClick={() => onSelect(item)}
                    alignItems="center"
                    sx={{ pr: 12 }} // Make room for actions
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={item.status === 'AI Suggestion' ? 'bold' : 'normal'}>
                            {item.label}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={statusLabel} 
                            color={statusColor} 
                            variant="outlined" 
                            icon={<StatusIcon />}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          color={item.value ? 'text.primary' : 'text.secondary'}
                          sx={{ mt: 0.5, fontStyle: item.value ? 'normal' : 'italic' }}
                        >
                          {item.value || (item.status === 'Saved' ? '' : 'Click to add')}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isSkill && onToggleFavorite && (
                            <Tooltip title={item.isFavorite ? "Remove from favorites" : "Mark as favorite"}>
                                <IconButton 
                                    edge="end" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(item.label);
                                    }}
                                    color={item.isFavorite ? "warning" : "default"}
                                >
                                    {item.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                            </Tooltip>
                        )}
                        <Button 
                            size="small" 
                            startIcon={item.status === 'Saved' ? <EditIcon /> : <AddIcon />}
                            onClick={() => onSelect(item)}
                            variant={item.status === 'AI Suggestion' ? 'contained' : 'text'}
                            color={item.status === 'AI Suggestion' ? 'secondary' : 'primary'}
                        >
                            {item.status === 'Saved' ? 'Edit' : 'Add'}
                        </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      ))}
    </Box>
  );
}
