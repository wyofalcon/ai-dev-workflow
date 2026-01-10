import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Alert
} from '@mui/material';
import {
  Memory as ChipIcon,
  Cloud as CloudIcon,
  Speed as SpeedIcon,
  Lock as PrivacyIcon,
  WifiOff as OfflineIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useWebLlm } from '../contexts/WebLlmContext.js';

/**
 * LocalAISetupModal
 * Shown on first use to explain local AI benefits and let user choose
 */
export default function LocalAISetupModal({ open, onClose }) {
  const { 
    initializeModel, 
    setAiMode,
    isReady,
    progress 
  } = useWebLlm();
  
  const [showDetails, setShowDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-close when ready if we were downloading
  useEffect(() => {
    if (isDownloading && isReady) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isDownloading, isReady, onClose]);

  const handleEnableLocalAI = () => {
    setIsDownloading(true);
    initializeModel();
  };

  const handleUseServerAI = () => {
    setAiMode("server");
    onClose();
  };

  const handleClose = () => {
    // If download completed successfully
    if (isReady || progress?.text?.includes('ready') || progress?.text?.includes('done')) {
      onClose();
    }
  };

  // Check if download is complete
  const isComplete = isReady || 
                    progress?.text?.toLowerCase().includes('ready') || 
                    progress?.text?.toLowerCase().includes('done');

  return (
    <Dialog 
      open={open} 
      onClose={isComplete ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ChipIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Enhance Your Experience
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!isDownloading ? (
          <>
            {/* Main explanation */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              CVstomize can run AI features directly on your device for faster, 
              more private resume building. This requires a one-time download.
            </Typography>

            {/* Benefits chips */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
              <Chip 
                icon={<SpeedIcon />} 
                label="Faster responses" 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                icon={<PrivacyIcon />} 
                label="100% private" 
                color="success" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                icon={<OfflineIcon />} 
                label="Works offline" 
                variant="outlined" 
                size="small" 
              />
            </Box>

            {/* Details collapse */}
            <Box 
              onClick={() => setShowDetails(!showDetails)}
              sx={{ 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'primary.main',
                mb: 1
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                What's the difference?
              </Typography>
              {showDetails ? <CollapseIcon /> : <ExpandIcon />}
            </Box>

            <Collapse in={showDetails}>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 2 }}>
                <Box display="flex" gap={3}>
                  {/* Local AI column */}
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      <ChipIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Local AI
                    </Typography>
                    <List dense disablePadding>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Data stays on device" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Instant responses" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Works offline" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CloseIcon color="warning" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="~2GB one-time download" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  {/* Server AI column */}
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      <CloudIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Server AI
                    </Typography>
                    <List dense disablePadding>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="No download needed" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Works anywhere" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CloseIcon color="warning" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Requires internet" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                      <ListItem disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <CloseIcon color="warning" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Data sent to cloud" 
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Box>
              </Box>
            </Collapse>

            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
              You can change this anytime in Settings.
            </Alert>
          </>
        ) : (
          /* Download progress view */
          <Box py={2}>
            <Typography variant="body1" gutterBottom fontWeight={500}>
              {isComplete ? '✅ Local AI Ready!' : 'Downloading AI Model...'}
            </Typography>
            
            <Box my={2}>
              <LinearProgress 
                variant="determinate" 
                value={(progress?.progress || 0) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {progress?.text || 'Initializing...'}
              </Typography>
            </Box>

            {isComplete && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Your AI is ready! Enjoy faster, private resume assistance.
              </Alert>
            )}

            {!isComplete && (
              <Typography variant="caption" color="text.secondary">
                This only happens once. The model is cached for future visits.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!isDownloading ? (
          <>
            <Button 
              onClick={handleUseServerAI}
              color="inherit"
            >
              Use Server AI
            </Button>
            <Button 
              onClick={handleEnableLocalAI}
              variant="contained"
              startIcon={<ChipIcon />}
            >
              Enable Local AI (~2GB)
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleClose}
            variant="contained"
            disabled={!isComplete}
          >
            {isComplete ? 'Get Started' : 'Downloading...'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * Mini indicator for AI mode (for use in header/settings)
 */
export function AIStatusIndicator() {
  const { isReady, aiMode, isLoading } = useWebLlm();

  if (isLoading) {
    return (
      <Chip 
        icon={<ChipIcon />} 
        label="Loading AI..." 
        size="small" 
        variant="outlined"
        color="warning"
      />
    );
  }

  if (isReady && aiMode !== "server") {
    return (
      <Chip 
        icon={<ChipIcon />} 
        label="Local AI" 
        size="small" 
        variant="outlined"
        color="success"
      />
    );
  }

  return (
    <Chip 
      icon={<CloudIcon />} 
      label="Server AI" 
      size="small" 
      variant="outlined"
      color="primary"
    />
  );
}

/**
 * Clickable AI Status Badge for header
 * Shows current AI mode and allows clicking to change settings
 */
export function AIStatusBadge({ onClick }) {
  const { isReady, aiMode, isLoading, progress } = useWebLlm();

  if (isLoading) {
    const progressPercent = progress?.progress ? Math.round(progress.progress * 100) : 0;
    return (
      <Chip 
        icon={<ChipIcon />} 
        label={`AI ${progressPercent}%`}
        size="small" 
        variant="outlined"
        color="warning"
        onClick={onClick}
        sx={{ 
          mr: 2, 
          cursor: 'pointer',
          display: { xs: 'none', md: 'flex' }
        }}
      />
    );
  }

  if (isReady && aiMode !== "server") {
    return (
      <Chip 
        icon={<ChipIcon />} 
        label="Local AI ⚡" 
        size="small" 
        variant="outlined"
        color="success"
        onClick={onClick}
        sx={{ 
          mr: 2, 
          cursor: 'pointer',
          display: { xs: 'none', md: 'flex' }
        }}
      />
    );
  }

  // Server AI or not configured - make it inviting to click
  return (
    <Chip 
      icon={<CloudIcon />} 
      label="Enable Local AI" 
      size="small" 
      variant="outlined"
      color="primary"
      onClick={onClick}
      sx={{ 
        mr: 2, 
        cursor: 'pointer',
        display: { xs: 'none', md: 'flex' },
        '&:hover': {
          bgcolor: 'primary.main',
          color: 'white',
          '& .MuiChip-icon': { color: 'white' }
        }
      }}
    />
  );
}
