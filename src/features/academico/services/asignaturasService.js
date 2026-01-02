import apiClient from '../../usuarios/services/usuariosService';

// Servicio para gestionar asignaturas y períodos académicos
export const asignaturasService = {
  // Asignaturas
  listar: (params = {}) => apiClient.get('/asignaturas/', { params }),
  crear: (data) => apiClient.post('/asignaturas/', data),
  actualizar: (id, data) => apiClient.patch(`/asignaturas/${id}/`, data),
  eliminar: (id) => apiClient.delete(`/asignaturas/${id}/`),

  // Alternar estado activo/inactivo
  cambiarEstado: (id, estado) => apiClient.patch(`/asignaturas/${id}/`, { estado }),

  // Períodos académicos
  listarPeriodos: () => apiClient.get('/periodos-academicos/'),
  crearPeriodo: (data) => apiClient.post('/periodos-academicos/', data),
  actualizarPeriodo: (id, data) => apiClient.patch(`/periodos-academicos/${id}/`, data),

  // Docentes (para combo de docente responsable)
  listarDocentes: () => apiClient.get('/usuarios/', { params: { rol: 'docente' } }),
};

export default asignaturasService;
