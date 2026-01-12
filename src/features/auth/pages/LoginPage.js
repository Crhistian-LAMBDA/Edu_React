import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '../../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const theme = useTheme();
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showInfo, setShowInfo] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('session_info_dismissed') === '1';
    setShowInfo(!dismissed);
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: theme.palette.background.default,
        backgroundImage: `radial-gradient(1200px 600px at 50% 0%, ${alpha(theme.palette.common.white, 0.06)} 0%, transparent 60%)`,
        px: 2,
      }}
    >
      <Paper
        variant="outlined"
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 420,
          backgroundColor: alpha(theme.palette.common.black, 0.35),
          borderColor: alpha(theme.palette.common.white, 0.12),
        }}
      >
        <Typography variant="h5" mb={2} sx={{ textAlign: 'center' }}>Iniciar sesión</Typography>
        <Button
          variant="text"
          fullWidth
          sx={{ mb: 1 }}
          onClick={() => navigate('/')}
        >
          Ir al inicio
        </Button>
        {showInfo && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{
              mb: 2,
              backgroundColor: alpha(theme.palette.common.black, 0.20),
              borderColor: alpha(theme.palette.primary.main, 0.35),
              color: alpha(theme.palette.common.white, 0.92),
              '& .MuiAlert-icon': { color: theme.palette.primary.main },
              '& .MuiAlert-action': { color: alpha(theme.palette.common.white, 0.9) },
            }}
            onClose={() => {
              localStorage.setItem('session_info_dismissed', '1');
              setShowInfo(false);
            }}
          >
            Tu sesión dura 1 hora. Se renovará automáticamente mientras uses la app.
            Si pasan 7 días, deberás iniciar sesión nuevamente.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField
            label="Correo" name="email" type="email" value={form.email}
            onChange={onChange} fullWidth sx={{ mb: 2 }} required
          />
          <TextField
            label="Contraseña" name="password" type="password" value={form.password}
            onChange={onChange} fullWidth sx={{ mb: 2 }} required
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
          <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/olvide-contraseña')}>
            ¿Olvidaste tu contraseña?
          </Button>
          <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/registro')}>
            ¿No tienes cuenta? Regístrate
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
