import apiClient from '../../usuarios/services/usuariosService';

const entregasService = {
  /**
   * Listar entregas con filtros opcionales
   * @param {Object} params - Filtros: tarea, estudiante, estado_entrega
   */
  listar: (params = {}) => {
    return apiClient.get('/entregas/', { params });
  },

  /**
   * Obtener detalle de una entrega
   * @param {number} id - ID de la entrega
   */
  obtener: (id) => {
    return apiClient.get(`/entregas/${id}/`);
  },

  /**
   * Crear nueva entrega (estudiante sube archivo)
   * @param {FormData} formData - Debe contener: tarea, archivo_entrega, comentarios_estudiante
   */
  crear: (formData) => {
    return apiClient.post('/entregas/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Calificar una entrega (solo docentes)
   * @param {number} id - ID de la entrega
   * @param {Object} data - { calificacion, comentarios_docente }
   */
  calificar: (id, data) => {
    return apiClient.post(`/entregas/${id}/calificar/`, data);
  },

  /**
   * Listar tareas publicadas (para que estudiante vea qué puede entregar)
   * @param {Object} params - Filtros opcionales
   */
  listarTareasPublicadas: (params = {}) => {
    return apiClient.get('/tareas/', {
      params: {
        estado: 'publicada',
        ...params,
      },
    });
  },

  /**
   * Descargar archivo de entrega
   * @param {string} url - URL del archivo
   */
  descargarArchivo: (url) => {
    window.open(url, '_blank');
  },
};

export default entregasService;
