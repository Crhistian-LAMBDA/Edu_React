import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { useAuth } from '../../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
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
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 380 }}>
        <Typography variant="h5" mb={2}>Iniciar sesión</Typography>
        {showInfo && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
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
