import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import RegistroPage from '../features/auth/pages/RegistroPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import DashboardPage from '../features/usuarios/pages/DashboardPage';
import PerfilPage from '../features/auth/pages/PerfilPage';
import UsuariosPage from '../features/usuarios/pages/UsuariosPage';
import AsignaturasPage from '../features/academico/pages/AsignaturasPage';
import FacultadesPage from '../features/academico/pages/FacultadesPage';
import CarrerasPage from '../features/academico/pages/CarrerasPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/olvide-contraseña" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Rutas protegidas con layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PerfilPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UsuariosPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academico/asignaturas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AsignaturasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academico/facultades"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FacultadesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academico/carreras"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CarrerasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}