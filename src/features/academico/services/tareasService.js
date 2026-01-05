/**
 * Servicio API para Tareas y Exámenes
 */
import apiClient from '../../usuarios/services/usuariosService';

const tareasService = {
  /**
   * Obtener lista de tareas con filtros
   */
  listar: (params = {}) =>
    apiClient.get('/tareas/', {
      params: { page_size: 1000, ...params }
    }),

  /**
   * Obtener una tarea específica
   */
  obtener: (id) => apiClient.get(`/tareas/${id}/`),

  /**
   * Crear nueva tarea
   */
  crear: (data) => apiClient.post('/tareas/', data),

  /**
   * Actualizar tarea
   */
  actualizar: (id, data) => apiClient.put(`/tareas/${id}/`, data),

  /**
   * Editar parcialmente una tarea
   */
  editarParcial: (id, data) => apiClient.patch(`/tareas/${id}/`, data),

  /**
   * Eliminar una tarea
   */
  eliminar: (id) => apiClient.delete(`/tareas/${id}/`),

  /**
   * Publicar una tarea (cambiar estado a publicada)
   */
  publicar: (id) => apiClient.post(`/tareas/${id}/publicar/`),

  /**
   * Cerrar una tarea (impedir nuevas entregas)
   */
  cerrar: (id) => apiClient.post(`/tareas/${id}/cerrar/`),

  /**
   * Obtener peso total de tareas por asignatura
   */
  pesoAsignatura: (asignaturaId) =>
    apiClient.get('/tareas/peso_por_asignatura/', {
      params: { asignatura_id: asignaturaId }
    }),

  /**
   * Listar asignaturas del docente
   */
  listarAsignaturas: (params = {}) =>
    apiClient.get('/asignaturas/', {
      params: { page_size: 1000, ...params }
    })
};

export default tareasService;
