import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { usuariosService } from '../../usuarios/services/usuariosService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    setLoading(true);

    try {
      await usuariosService.soliciarRecuperacion(email);
      setSuccess('Si el correo existe, recibirás un enlace de recuperación. Revisa tu bandeja de entrada.');
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error de conexión. Intenta nuevamente.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', p: 4, boxShadow: 3 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center' }}>
            ¿Olvidaste tu contraseña?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
            Ingresa tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña
          </Typography>

          {error && !submitted && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && submitted && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                placeholder="tu@correo.com"
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Enviar enlace de recuperación'}
              </Button>
            </form>
          ) : (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Hemos enviado un enlace de recuperación a tu correo.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Si no recibes el correo en los próximos minutos, revisa tu carpeta de spam.
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button color="primary" onClick={handleBackToLogin}>
              ¿Recordaste tu contraseña? Inicia sesión
            </Button>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}
