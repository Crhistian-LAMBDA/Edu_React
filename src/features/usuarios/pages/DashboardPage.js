import React from 'react';
import { Box } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box
      sx={{
        // El layout aplica padding al <main>; lo anulamos para que el dashboard sea full-bleed.
        m: { xs: -2, md: -3 },
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        backgroundImage: 'url(/logo_Dashboard.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    />
  );
}
