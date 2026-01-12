import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRoles = Array.isArray(user?.roles)
      ? user.roles
      : user?.rol
        ? [user.rol]
        : [];

    const hasAnyRole = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAnyRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
