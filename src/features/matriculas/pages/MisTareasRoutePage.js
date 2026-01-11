import React from 'react';
import { Alert, Box } from '@mui/material';
import { useAuth } from '../../../hooks/AuthContext';
import MisTareasPage from './MisTareasPage';
import TareasPage from '../../academico/pages/TareasPage';

const getUserRoles = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
  if (user.rol) return [user.rol];
  return [];
};

export default function MisTareasRoutePage() {
  const { user } = useAuth();
  const roles = getUserRoles(user);

  const esEstudiante = roles.includes('estudiante');
  if (esEstudiante) {
    return <MisTareasPage />;
  }

  const puedeVerComoStaff = roles.some((r) => ['profesor', 'docente', 'coordinador', 'admin', 'super_admin'].includes(r));
  if (puedeVerComoStaff) {
    return <TareasPage />;
  }

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Alert severity="error">No tienes permisos para ver esta sección.</Alert>
    </Box>
  );
}
