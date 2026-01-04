import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, Grid, Avatar, Chip, Card, CardContent
} from '@mui/material';
import { Person, School, Business, MenuBook, Lock, Check, Close } from '@mui/icons-material';
import { useAuth } from '../../../hooks/AuthContext';
import { getDisplayName } from '../../../shared/utils/roleDisplayNames';

export default function PerfilPage() {
  const { user, actualizarUsuario, cambiarPassword } = useAuth();
  const [form, setForm] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password_actual: '', password_nuevo: '', password_nuevo_confirm: ''
  });
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [passwordOk, setPasswordOk] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  useEffect(() => {
    setForm(user);
  }, [user]);

  if (!form) return null;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onPasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // Validar contraseña
  const validarPassword = () => {
    const { password_nuevo, password_nuevo_confirm } = passwordForm;
    
    if (!password_nuevo || !password_nuevo_confirm) {
      return 'Todos los campos son requeridos.';
    }
    
    if (password_nuevo.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    
    if (!/[A-Z]/.test(password_nuevo)) {
      return 'La contraseña debe contener al menos una letra mayúscula.';
    }
    
    if (!/[0-9]/.test(password_nuevo)) {
      return 'La contraseña debe contener al menos un número.';
    }
    
    if (password_nuevo !== password_nuevo_confirm) {
      return 'Las contraseñas nuevas no coinciden.';
    }
    
    return null; // Sin errores
  };

  // Función para obtener el estado de validaciones individuales
  const getValidationStatus = () => {
    const { password_nuevo, password_nuevo_confirm } = passwordForm;
    return {
      hasLength: password_nuevo.length >= 8,
      hasUpper: /[A-Z]/.test(password_nuevo),
      hasNumber: /[0-9]/.test(password_nuevo),
      matches: password_nuevo && password_nuevo_confirm && password_nuevo === password_nuevo_confirm
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(''); setErr('');
    try {
      await actualizarUsuario(form.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        numero_documento: form.numero_documento,
      });
      setOk('Perfil actualizado correctamente.');
      setTimeout(() => setOk(''), 3000);
    } catch (error) {
      setErr(error.response?.data?.detail || 'Error al actualizar perfil.');
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordOk(''); setPasswordErr('');
    
    // Validar contraseña antes de enviar
    const validationError = validarPassword();
    if (validationError) {
      setPasswordErr(validationError);
      return;
    }
    
    try {
      await cambiarPassword(passwordForm);
      setPasswordOk('Contraseña actualizada correctamente. Se envió un correo de confirmación.');
      setPasswordForm({ password_actual: '', password_nuevo: '', password_nuevo_confirm: '' });
      setTimeout(() => setPasswordOk(''), 4000);
    } catch (error) {
      setPasswordErr(error.response?.data?.detail || 'Error al cambiar contraseña.');
    }
  };

  const onCancel = () => {
    setForm(user);
    setErr('');
    setOk('');
  };

  const getInitials = () => {
    const first = form.first_name?.[0] || form.username?.[0] || '?';
    const last = form.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getRolColor = (rol) => {
    const colors = {
      super_admin: 'error',
      admin: 'warning',
      profesor: 'info',
      estudiante: 'success'
    };
    return colors[rol] || 'default';
  };

  // Componente para mostrar validaciones
  const ValidationItem = ({ valid, text }) => (
    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
      {valid ? (
        <Check sx={{ fontSize: '1.2rem', color: 'success.main' }} />
      ) : (
        <Close sx={{ fontSize: '1.2rem', color: 'text.disabled' }} />
      )}
      <Typography 
        variant="caption" 
        sx={{ color: valid ? 'success.main' : 'text.disabled' }}
      >
        {text}
      </Typography>
    </Box>
  );

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Encabezado con Avatar */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {getInitials()}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4">
                  {form.first_name} {form.last_name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  @{form.username}
                </Typography>
                <Box mt={1} display="flex" gap={1}>
                  <Chip
                    label={getDisplayName(form.rol)}
                    color={getRolColor(form.rol)}
                    size="small"
                    icon={<Person />}
                  />
                  <Chip
                    label={form.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    color={form.estado === 'activo' ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Columna Izquierda - Información Personal */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
              <Person /> Información Personal
            </Typography>
            {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <Box component="form" onSubmit={onSubmit}>
              <TextField
                label="Usuario"
                value={form.username}
                fullWidth
                sx={{ mb: 2 }}
                disabled
                size="small"
              />
              <TextField
                label="Nombre"
                name="first_name"
                value={form.first_name || ''}
                onChange={onChange}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />
              <TextField
                label="Apellido"
                name="last_name"
                value={form.last_name || ''}
                onChange={onChange}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />
              <TextField
                label="Correo electrónico"
                name="email"
                type="email"
                value={form.email || ''}
                onChange={onChange}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />
              <TextField
                label="Número de documento"
                name="numero_documento"
                value={form.numero_documento || ''}
                onChange={onChange}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
                helperText="Documento de identidad"
              />
              <Box display="flex" gap={2}>
                <Button type="submit" variant="contained" fullWidth>
                  Guardar Cambios
                </Button>
                <Button variant="outlined" fullWidth onClick={onCancel}>
                  Cancelar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Columna Derecha - Info Académica y Cambio de Contraseña */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box display="flex" flexDirection="column" gap={3} height="100%">
            {/* Información Académica */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <School /> Información Académica
              </Typography>
              <Grid container spacing={2}>
                {form.facultad_nombre && (
                  <Grid size={12}>
                    <Card variant="outlined">
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Facultad</Typography>
                          <Typography variant="body1">{form.facultad_nombre}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {form.programa_nombre && (
                  <Grid size={12}>
                    <Card variant="outlined">
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBook color="success" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Programa</Typography>
                          <Typography variant="body1">{form.programa_nombre}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {form.rol === 'profesor' && form.asignaturas_ids?.length > 0 && (
                  <Grid size={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">Asignaturas asignadas</Typography>
                        <Typography variant="body1">{form.asignaturas_ids.length} asignatura(s)</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {!form.facultad_nombre && !form.programa_nombre && form.rol === 'estudiante' && (
                  <Grid size={12}>
                    <Alert severity="info" variant="outlined">
                      No tienes programa académico asignado aún.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Cambiar Contraseña */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
                <Lock /> Cambiar Contraseña
              </Typography>
              {passwordOk && <Alert severity="success" sx={{ mb: 2 }}>{passwordOk}</Alert>}
              {passwordErr && <Alert severity="error" sx={{ mb: 2 }}>{passwordErr}</Alert>}
              <Box component="form" onSubmit={onPasswordSubmit}>
                <TextField
                  label="Contraseña actual"
                  name="password_actual"
                  type="password"
                  value={passwordForm.password_actual}
                  onChange={onPasswordChange}
                  fullWidth
                  sx={{ mb: 2 }}
                  size="small"
                  required
                />
                <TextField
                  label="Nueva contraseña"
                  name="password_nuevo"
                  type="password"
                  value={passwordForm.password_nuevo}
                  onChange={onPasswordChange}
                  fullWidth
                  sx={{ mb: 1 }}
                  size="small"
                  required
                />
                {/* Validaciones en tiempo real */}
                {passwordForm.password_nuevo && (
                  <Box sx={{ mb: 2, pl: 1 }}>
                    <ValidationItem 
                      valid={getValidationStatus().hasLength} 
                      text="8+ caracteres" 
                    />
                    <ValidationItem 
                      valid={getValidationStatus().hasUpper} 
                      text="Mayúscula (A-Z)" 
                    />
                    <ValidationItem 
                      valid={getValidationStatus().hasNumber} 
                      text="Número (0-9)" 
                    />
                  </Box>
                )}
                <TextField
                  label="Confirmar nueva contraseña"
                  name="password_nuevo_confirm"
                  type="password"
                  value={passwordForm.password_nuevo_confirm}
                  onChange={onPasswordChange}
                  fullWidth
                  sx={{ mb: 1 }}
                  size="small"
                  required
                />
                {/* Validación de coincidencia */}
                {passwordForm.password_nuevo_confirm && (
                  <Box sx={{ mb: 2, pl: 1 }}>
                    <ValidationItem 
                      valid={getValidationStatus().matches} 
                      text="Las contraseñas coinciden" 
                    />
                  </Box>
                )}
                <Button type="submit" variant="contained" color="secondary" fullWidth>
                  Actualizar Contraseña
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
