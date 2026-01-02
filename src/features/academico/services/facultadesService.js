import apiClient from '../../usuarios/services/usuariosService';

/**
 * Servicio para gestionar Facultades
 * Endpoints: GET /api/facultades/, POST, PATCH, DELETE
 */
export const facultadesService = {
  // Listar todas las facultades
  listar: (params = {}) => apiClient.get('/facultades/', { params }),
  
  // Obtener una facultad por ID
  obtener: (id) => apiClient.get(`/facultades/${id}/`),
  
  // Crear nueva facultad
  crear: (data) => apiClient.post('/facultades/', data),
  
  // Actualizar facultad
  actualizar: (id, data) => apiClient.patch(`/facultades/${id}/`, data),
  
  // Eliminar facultad
  eliminar: (id) => apiClient.delete(`/facultades/${id}/`),
};

export default facultadesService;
