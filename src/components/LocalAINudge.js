// [FEAT-LOCALAI-001] Local AI Nudge
import React, { useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  Slide
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as ChipIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';

/**
 * LocalAINudge
 * Shows a gentle reminder after user has used server AI multiple times
 * Encourages them to enable local AI for faster experience
 */
export default function LocalAINudge({ onOpenSetup }) {
  const { 
    shouldNudgeLocalAI, 
    lastUsedSource,
    dismissNudge
  } = useWebLlm();
  
  const [dismissed, setDismissed] = useState(false);

  // Show nudge after 3+ server calls
  const showNudge = shouldNudgeLocalAI && lastUsedSource === "server" && !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    dismissNudge();
  };

  const handleEnableClick = () => {
    setDismissed(true);
    onOpenSetup?.();
  };

  return (
    <Snackbar
      open={showNudge}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={Slide}
      autoHideDuration={15000}
      onClose={handleDismiss}
    >
      <Alert 
        severity="info"
        variant="filled"
        icon={<SpeedIcon />}
        sx={{ 
          alignItems: 'center',
          '& .MuiAlert-message': { display: 'flex', alignItems: 'center', gap: 2 }
        }}
        action={
          <Box display="flex" gap={1}>
            <Button 
              color="inherit" 
              size="small"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
            <Button 
              color="inherit" 
              size="small"
              variant="outlined"
              startIcon={<ChipIcon />}
              onClick={handleEnableClick}
              sx={{ fontWeight: 600 }}
            >
              Enable Now
            </Button>
          </Box>
        }
      >
        <Typography variant="body2">
          <strong>Want faster AI?</strong> Enable Local AI for instant responses.
        </Typography>
      </Alert>
    </Snackbar>
  );
}

/**
 * ServerAIIndicator
 * Brief toast showing that server AI was used (for transparency)
 */
export function ServerAIUsedToast() {
  const { lastUsedSource, isReady, hasDeclinedLocalAI } = useWebLlm();
  const [open, setOpen] = useState(false);

  // Show brief indicator when server AI is used and user hasn't explicitly chosen it
  React.useEffect(() => {
    if (lastUsedSource === "server" && !isReady && !hasDeclinedLocalAI) {
      setOpen(true);
    }
  }, [lastUsedSource, isReady, hasDeclinedLocalAI]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        severity="success" 
        variant="outlined"
        sx={{ bgcolor: 'background.paper' }}
      >
        ✓ Processed with Cloud AI
      </Alert>
    </Snackbar>
  );
}
