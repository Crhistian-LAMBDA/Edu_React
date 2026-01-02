import apiClient from '../../usuarios/services/usuariosService';

/**
 * Servicio para gestionar Plan Carrera-Asignatura
 * Endpoints: GET /api/planes-carrera-asignaturas/, POST, PATCH, DELETE
 * Nota: Asocia asignaturas a carreras con semestre y obligatoriedad
 */
export const planesService = {
  // Listar todos los planes carrera-asignatura
  listar: (params = {}) => apiClient.get('/planes-carrera-asignaturas/', { params }),
  
  // Obtener un plan por ID
  obtener: (id) => apiClient.get(`/planes-carrera-asignaturas/${id}/`),
  
  // Crear nuevo plan (asociar asignatura a carrera)
  crear: (data) => apiClient.post('/planes-carrera-asignaturas/', data),
  
  // Actualizar plan
  actualizar: (id, data) => apiClient.patch(`/planes-carrera-asignaturas/${id}/`, data),
  
  // Eliminar plan
  eliminar: (id) => apiClient.delete(`/planes-carrera-asignaturas/${id}/`),
  
  // Filtrar planes por carrera
  listarPorCarrera: (carreraId) => 
    apiClient.get('/planes-carrera-asignaturas/', { params: { carrera: carreraId } }),
  
  // Filtrar planes por semestre
  listarPorSemestre: (semestre) => 
    apiClient.get('/planes-carrera-asignaturas/', { params: { semestre } }),
  
  // Filtrar solo asignaturas obligatorias
  listarObligatorias: (carreraId) => 
    apiClient.get('/planes-carrera-asignaturas/', { 
      params: { carrera: carreraId, es_obligatoria: true } 
    }),
};

export default planesService;
