import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

export default function DependencyModal({ 
  open, 
  onClose, 
  sectionName, 
  fieldName, 
  onCreateAndAdd, 
  onCustomize 
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Add {sectionName} to your profile?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          To save <strong>{fieldName}</strong>, we'll first create the <strong>{sectionName}</strong> section.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onCustomize} color="primary">
          Customize section
        </Button>
        <Button onClick={onCreateAndAdd} variant="contained" color="primary" autoFocus>
          Create section & add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
