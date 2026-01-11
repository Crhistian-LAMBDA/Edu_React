import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      // Paleta basada en el escudo (dorado metálico)
      main: '#D4AF37',
      light: '#F2D675',
      dark: '#9C7A1E',
      contrastText: '#000000',
    },
    secondary: {
      main: '#9CA3AF',
      light: '#D1D5DB',
      dark: '#6B7280',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    background: {
      // Fondo oscuro consistente en todas las vistas
      default: '#0b0b0b',
      paper: '#121212',
    },
    text: {
      primary: '#ffffff',
      secondary: alpha('#ffffff', 0.75),
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        // Evita el fondo azul/amarillo del autocompletado del navegador en modo oscuro
        'input:-webkit-autofill, textarea:-webkit-autofill, select:-webkit-autofill': {
          WebkitBoxShadow: `0 0 0 1000px ${alpha(theme.palette.common.black, 0.20)} inset`,
          WebkitTextFillColor: theme.palette.text.primary,
          caretColor: theme.palette.text.primary,
          borderRadius: 'inherit',
          transition: 'background-color 9999s ease-out 0s',
        },
        'input:-webkit-autofill:hover, textarea:-webkit-autofill:hover, select:-webkit-autofill:hover': {
          WebkitBoxShadow: `0 0 0 1000px ${alpha(theme.palette.common.black, 0.24)} inset`,
        },
        'input:-webkit-autofill:focus, textarea:-webkit-autofill:focus, select:-webkit-autofill:focus': {
          WebkitBoxShadow: `0 0 0 1000px ${alpha(theme.palette.common.black, 0.24)} inset`,
        },
      }),
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 0,
          // Negro con degradado: un negro más "brillante" a uno más mate
          backgroundImage: `linear-gradient(90deg,
            ${alpha(theme.palette.common.black, 0.92)},
            ${alpha(theme.palette.common.black, 0.82)},
            ${alpha(theme.palette.common.black, 0.70)}
          )`,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          '&.MuiButton-containedPrimary': {
            color: theme.palette.primary.contrastText,
            backgroundImage: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              backgroundImage: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.primary.dark} 100%)`,
            },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: alpha(theme.palette.primary.main, 0.55),
            color: theme.palette.primary.main,
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8),
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          backgroundImage: 'none',
        }),
        outlined: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.common.black, 0.35),
          borderColor: alpha(theme.palette.common.white, 0.10),
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.common.black, 0.20),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.common.white, 0.16),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.common.white, 0.26),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.8),
          },
        }),
        input: ({ theme }) => ({
          color: theme.palette.text.primary,
          '::placeholder': {
            color: alpha(theme.palette.common.white, 0.7),
            opacity: 1,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: alpha(theme.palette.common.white, 0.75),
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
  },
});
