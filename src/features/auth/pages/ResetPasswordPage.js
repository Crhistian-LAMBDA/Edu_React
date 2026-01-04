import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { usuariosService } from '../../usuarios/services/usuariosService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password_nueva: '',
    password_nueva_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    const validarToken = async () => {
      try {
        const response = await usuariosService.validarToken(token);
        if (response.data.valido) {
          setTokenValid(true);
        } else {
          setError(response.data.mensaje || 'Token inválido');
        }
      } catch (err) {
        setError('Error al validar token');
      } finally {
        setLoading(false);
      }
    };

    validarToken();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación básica
    if (!formData.password_nueva || !formData.password_nueva_confirm) {
      setError('Ambas contraseñas son requeridas');
      return;
    }

    if (formData.password_nueva !== formData.password_nueva_confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password_nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      await usuariosService.resetearPassword(
        token,
        formData.password_nueva,
        formData.password_nueva_confirm
      );

      setSuccess('Contraseña actualizada exitosamente. Redirigiendo a login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al resetear contraseña';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Alert severity="error">{error || 'Token inválido o expirado'}</Alert>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Volver a Login
          </Button>
        </Box>
      </Container>
    );
  }

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
            Resetear Contraseña
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
            Ingresa tu nueva contraseña
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type={showPassword ? 'text' : 'password'}
              name="password_nueva"
              value={formData.password_nueva}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirmar Contraseña"
              type={showConfirm ? 'text' : 'password'}
              name="password_nueva_confirm"
              value={formData.password_nueva_confirm}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm(!showConfirm)}
                      edge="end"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Actualizar Contraseña'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button color="primary" onClick={() => navigate('/login')}>
              Volver a Login
            </Button>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}
