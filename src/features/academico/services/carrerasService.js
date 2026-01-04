import apiClient from '../../usuarios/services/usuariosService';

/**
 * Servicio para gestionar Carreras
 * Endpoints: GET /api/carreras/, POST, PATCH, DELETE
 * Nota: Coordinadores solo ven/editan carreras de su facultad
 */
export const carrerasService = {
  // Listar todas las carreras (filtrado por facultad para coordinador)
  listar: (params = {}) => apiClient.get('/carreras/', { params: { ...params, page_size: 1000 } }),
  
  // Obtener una carrera por ID
  obtener: (id) => apiClient.get(`/carreras/${id}/`),
  
  // Crear nueva carrera
  crear: (data) => apiClient.post('/carreras/', data),
  
  // Actualizar carrera
  actualizar: (id, data) => apiClient.patch(`/carreras/${id}/`, data),
  
  // Eliminar carrera
  eliminar: (id) => apiClient.delete(`/carreras/${id}/`),
  
  // Filtrar por facultad
  listarPorFacultad: (facultadId) => 
    apiClient.get('/carreras/', { params: { facultad: facultadId } }),
  
  // Filtrar por nivel
  listarPorNivel: (nivel) => 
    apiClient.get('/carreras/', { params: { nivel } }),
};

export default carrerasService;
