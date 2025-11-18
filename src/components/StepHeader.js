import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StepHeader({ graphic, icon, title }) {
  return (
    <>
      {graphic}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h5">{title}</Typography>
      </Box>
    </>
  );
}
