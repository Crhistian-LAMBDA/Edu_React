import apiClient from '../../usuarios/services/usuariosService';

const staffCalificacionesService = {
  obtenerResumen: (params) => apiClient.get('/staff-calificaciones/', { params }),
};

export default staffCalificacionesService;
