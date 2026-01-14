/**
 * Servicio API para Tareas y Exámenes
 */
import apiClient from '../../usuarios/services/usuariosService';

const tareasService = {
    /**
     * Obtener lista de tareas solo para estudiante (materias con horario)
     */
    listarEstudiante: () =>
      apiClient.get('/mis-tareas/'),
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
  crear: (data, isFormData = false) => {
    if (isFormData) {
      return apiClient.post('/tareas/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.post('/tareas/', data);
  },

  /**
   * Actualizar tarea
   */
  actualizar: (id, data, isFormData = false) => {
    if (isFormData) {
      return apiClient.put(`/tareas/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.put(`/tareas/${id}/`, data);
  },

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
    }),

  /**
   * Obtener tareas publicadas del estudiante (solo sus asignaturas matriculadas en periodo activo)
   */
  listarTareasEstudiante: () =>
    apiClient.get('/tareas/mis-tareas-publicadas/', {
      params: { page_size: 1000 }
    })
};

export default tareasService;
