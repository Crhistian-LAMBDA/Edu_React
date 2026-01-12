import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar token en cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para renovar token al expirar
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken
          });
          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const usuariosService = {
  // Registro
  registro: (data) => apiClient.post('/usuarios/registro/', data),

  // Login
  login: (email, password) =>
    apiClient.post('/usuarios/login/', { email, password }),

  // Obtener perfil del usuario autenticado
  obtenerPerfil: () => apiClient.get('/usuarios/me/'),

  // Listar todos los usuarios
  listarUsuarios: () => apiClient.get('/usuarios/'),

  // Actualizar usuario
  actualizarUsuario: (id, data) =>
    apiClient.patch(`/usuarios/${id}/`, data),

  // Cambiar contraseña
  cambiarPassword: (data) =>
    apiClient.post('/auth/cambiar-password/', data),

  // Eliminar usuario
  eliminarUsuario: (id) =>
    apiClient.delete(`/usuarios/${id}/`),
  
  // Recuperación de contraseña
  soliciarRecuperacion: (email) =>
    apiClient.post('/usuarios/solicitar-recuperacion/', { email }),
    
  resetearPassword: (token, password_nueva, password_nueva_confirm) =>
    apiClient.post('/usuarios/resetear-password/', {
      token,
      password_nueva,
      password_nueva_confirm
    }),
    
  validarToken: (token) =>
    apiClient.post('/usuarios/validar-token/', { token }),
  
  // Entidades académicas
  listarFacultades: () => apiClient.get('/facultades/'),
  listarAsignaturas: () => apiClient.get('/asignaturas/'),
  listarCarreras: () => apiClient.get('/carreras/'),

  // Logout (solo limpia localmente, backend no requiere)
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  // Refrescar access token de forma proactiva
  refrescarAccess: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No hay refresh token');
    const { data } = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
    localStorage.setItem('access_token', data.access);
    return data;
  },
};

export default apiClient;
