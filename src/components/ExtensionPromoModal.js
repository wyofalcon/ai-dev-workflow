// [FEAT-EXT-001] Extension Promo Modal
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip
} from '@mui/material';
import {
  Extension as ExtensionIcon,
  Security as PrivacyIcon,
  Speed as SpeedIcon,
  Devices as GpuIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const EXTENSION_PROMO_KEY = 'cvstomize_extension_promo_seen';

export default function ExtensionPromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen this promo
    const hasSeen = localStorage.getItem(EXTENSION_PROMO_KEY);
    
    // Check if extension is already installed (Extension content script should set this attribute)
    const isInstalled = document.documentElement.getAttribute('data-cvstomize-extension-installed');

    if (!hasSeen && !isInstalled) {
      // Show after a short delay to let the dashboard load
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(EXTENSION_PROMO_KEY, 'true');
  };

  const handleInstall = () => {
    // Placeholder for Chrome Web Store URL
    window.open('#', '_blank'); 
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <ExtensionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h5" fontWeight={700}>
          Unlock the Full Power of CVstomize
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Get our free Chrome Extension to tailor your resume instantly while browsing job sites like LinkedIn and Indeed.
        </Typography>

        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, my: 2 }}>
          <List dense disablePadding>
            <ListItem>
              <ListItemIcon><PrivacyIcon color="success" /></ListItemIcon>
              <ListItemText 
                primary="Secure & Fast" 
                secondary="Powered by Vertex AI. Professional-grade analysis in seconds."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SpeedIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="Instant Job Analysis" 
                secondary="Analyze job descriptions with one click without switching tabs."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="secondary" /></ListItemIcon>
              <ListItemText 
                primary="Works Everywhere" 
                secondary="Seamless integration with CVstomize.com and major job boards."
              />
            </ListItem>
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1, pb: 3, px: 3 }}>
        <Button 
          variant="contained" 
          size="large" 
          fullWidth 
          onClick={handleInstall}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          Get the Extension
        </Button>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          size="small"
          sx={{ width: '100%', ml: '0 !important' }}
        >
          No thanks, maybe later
        </Button>
      </DialogActions>
    </Dialog>
  );
}
