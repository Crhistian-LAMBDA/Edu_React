import React, { createContext, useContext, useState, useEffect } from 'react';
import { usuariosService } from '../features/usuarios/services/usuariosService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTimerId, setRefreshTimerId] = useState(null);

  // Verificar si hay token al cargar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      cargarPerfil();
    } else {
      setLoading(false);
    }
  }, []);

  // Utilidad: obtener expiración (ms) de un JWT
  const getExpMs = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  // Chequear y refrescar si faltan <5 minutos
  const maybeRefreshAccess = async () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (!access || !refresh) return;
    const expMs = getExpMs(access);
    if (!expMs) return;
    const remaining = expMs - Date.now();
    const threshold = 5 * 60 * 1000; // 5 minutos
    if (remaining < threshold) {
      try {
        await usuariosService.refrescarAccess();
      } catch (e) {
        // Si no se puede refrescar, cerrar sesión
        logout();
      }
    }
  };

  // Iniciar intervalo de verificación cada 60s
  useEffect(() => {
    // Limpiar si ya existe
    if (refreshTimerId) {
      clearInterval(refreshTimerId);
      setRefreshTimerId(null);
    }
    // Solo si hay sesión
    if (localStorage.getItem('access_token') && localStorage.getItem('refresh_token')) {
      // Ejecutar una vez al inicio
      maybeRefreshAccess();
      const id = setInterval(maybeRefreshAccess, 60 * 1000);
      setRefreshTimerId(id);
      return () => clearInterval(id);
    }
  }, [user]);

  // Obtener perfil del usuario
  const cargarPerfil = async () => {
    try {
      const response = await usuariosService.obtenerPerfil();
      setUser(response.data);
      setError(null);
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.login(email, password);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.usuario);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error en login';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const registro = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.registro(data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data || 'Error en registro';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    usuariosService.logout();
    setUser(null);
    setError(null);
    if (refreshTimerId) {
      clearInterval(refreshTimerId);
      setRefreshTimerId(null);
    }
  };

  // Actualizar usuario
  const actualizarUsuario = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.actualizarUsuario(id, data);
      setUser(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data || 'Error al actualizar';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const cambiarPassword = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usuariosService.cambiarPassword(data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data || 'Error al cambiar contraseña';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    registro,
    logout,
    actualizarUsuario,
    cambiarPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe estar dentro de AuthProvider');
  }
  return context;
};