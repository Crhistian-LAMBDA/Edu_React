import React, { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './routes/routes';
import { AuthProvider } from './hooks/AuthContext';
import { SearchProvider } from './shared/context/SearchContext';
import { getAppTheme } from './theme';
import { ColorModeProvider, useColorMode } from './shared/context/ColorModeContext';

function AppWithTheme() {
  const { mode } = useColorMode();
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SearchProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ColorModeProvider>
      <AppWithTheme />
    </ColorModeProvider>
  );
}

export default App;