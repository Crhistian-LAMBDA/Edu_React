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
import RolesPermisosPage from '../features/usuarios/pages/RolesPermisosPage';
import AsignaturasPage from '../features/academico/pages/AsignaturasPage';
import PeriodosAdminPage from '../features/academico/pages/PeriodosAdminPage';
import FacultadesPage from '../features/academico/pages/FacultadesPage';
import CarrerasPage from '../features/academico/pages/CarrerasPage';
import TareasPage from '../features/academico/pages/TareasPage';
import EntregasPage from '../features/academico/pages/EntregasPage';
import MatriculaPage from '../features/matriculas/pages/MatriculaPage';
import MisTareasRoutePage from '../features/matriculas/pages/MisTareasRoutePage';
import MisCalificacionesPage from '../features/matriculas/pages/MisCalificacionesPage';
import MisAsignaturasEstudiantePage from '../features/academico/pages/MisAsignaturasEstudiantePage';
import GestionEntregasPage from '../features/academico/pages/GestionEntregasPage';
import TareasEntregadasProfesorPage from '../features/usuarios/pages/TareasEntregadasProfesorPage';
import HomePage from '../features/public/pages/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
            <Route
              path="/profesor/entregas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TareasEntregadasProfesorPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
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
        path="/admin/periodos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PeriodosAdminPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/matricula"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MatriculaPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-asignaturas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MisAsignaturasEstudiantePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-tareas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MisTareasRoutePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mis-calificaciones"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MisCalificacionesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles-permisos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RolesPermisosPage />
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
      <Route
        path="/academico/tareas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TareasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academico/entregas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EntregasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestion-entregas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GestionEntregasPage />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}