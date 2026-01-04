import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography, Alert, Paper
} from '@mui/material';
import { useAuth } from '../../../hooks/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RegistroPage() {
  const { registro, loading } = useAuth();
  const navigate = useNavigate();
  const [ok, setOk] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', email: '', numero_documento: '',
    password: '', password_confirm: '',
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(''); setErrors({});
    try {
      await registro(form);
      setOk('Usuario creado correctamente. Por favor espera a que un decano apruebe tu cuenta.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const apiErrors = err.response?.data?.errors || err.response?.data || {};
      setErrors(apiErrors);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 520 }}>
        <Typography variant="h5" mb={2}>Registro de usuario</Typography>
        {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
        {errors.non_field_errors && <Alert severity="error" sx={{ mb: 2 }}>{errors.non_field_errors}</Alert>}
        <Box component="form" onSubmit={onSubmit}>
          <TextField 
            label="Usuario" name="username" value={form.username} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.username} helperText={errors.username?.[0]} 
          />
          <TextField 
            label="Nombre" name="first_name" value={form.first_name} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.first_name} helperText={errors.first_name?.[0]} 
          />
          <TextField 
            label="Apellido" name="last_name" value={form.last_name} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.last_name} helperText={errors.last_name?.[0]} 
          />
          <TextField 
            label="Número de documento" name="numero_documento" value={form.numero_documento} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.numero_documento} helperText={errors.numero_documento?.[0]} 
          />
          <TextField 
            label="Correo" name="email" type="email" value={form.email} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.email} helperText={errors.email?.[0]} 
          />
          <TextField 
            label="Contraseña" name="password" type="password" value={form.password} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.password} helperText={errors.password?.[0]} 
          />
          <TextField 
            label="Confirmar contraseña" name="password_confirm" type="password" value={form.password_confirm} onChange={onChange} 
            fullWidth sx={{ mb: 2 }} required 
            error={!!errors.password_confirm} helperText={errors.password_confirm?.[0]} 
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </Button>
          <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/login')}>
            ¿Ya tienes cuenta? Inicia sesión
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
