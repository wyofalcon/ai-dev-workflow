import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Profile Completion Modal
 *
 * Prompts users to complete their profile before generating first resume.
 * Ensures resumes have complete contact information.
 *
 * Option B: Pre-generation prompt (just-in-time data collection)
 */
function ProfileCompletionModal({ open, onClose, onSave, currentProfile, userEmail }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    linkedinUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-populate form with existing profile data
  useEffect(() => {
    if (currentProfile) {
      setFormData({
        fullName: currentProfile.fullName || '',
        phone: currentProfile.phone || '',
        location: currentProfile.location || '',
        linkedinUrl: currentProfile.linkedinUrl || ''
      });
    }
  }, [currentProfile]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Validate at least name is provided for better resumes
  const isValid = formData.fullName.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" component="span">
            Complete Your Profile
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Add your contact information now to ensure your first resume is complete and professional.
            You can always update this later in your profile settings.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            margin="normal"
            required
            placeholder="John Doe"
            helperText="Your name will appear at the top of your resume"
            autoFocus
          />

          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange('phone')}
            margin="normal"
            placeholder="(555) 123-4567"
            helperText="Your contact number for potential employers"
          />

          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={handleChange('location')}
            margin="normal"
            placeholder="San Francisco, CA"
            helperText="City and state where you're based or seeking work"
          />

          <TextField
            fullWidth
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={handleChange('linkedinUrl')}
            margin="normal"
            placeholder="linkedin.com/in/johndoe"
            helperText="Your LinkedIn profile link (optional)"
          />

          <TextField
            fullWidth
            label="Email"
            value={userEmail || ''}
            margin="normal"
            disabled
            helperText="From your Google account (cannot be changed)"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleSkip}
          disabled={loading}
          color="inherit"
        >
          Skip for Now
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProfileCompletionModal;
