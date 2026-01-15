import axios from 'axios';

import { getApiBaseUrl } from './config/apiConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Interceptor para agregar el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
