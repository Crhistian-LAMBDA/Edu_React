import axios from 'axios';

import { getApiBaseUrl } from '../../../core/config/apiConfig';

const API_URL = getApiBaseUrl();

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

export const rolesService = {
  // Listar todos los roles con sus permisos
  listarRoles: () => apiClient.get('/roles/'),
  
  // Obtener un rol específico con sus permisos
  obtenerRol: (id) => apiClient.get(`/roles/${id}/`),
  
  // Listar todos los permisos disponibles
  listarPermisos: () => apiClient.get('/permisos/'),
  
  // Actualizar permisos de un rol
  actualizarPermisosRol: (rolId, permisosIds) => 
    apiClient.put(`/roles/${rolId}/permisos/`, { permisos_ids: permisosIds }),
};
