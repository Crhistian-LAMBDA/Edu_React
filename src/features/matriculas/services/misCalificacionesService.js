import apiClient from '../../usuarios/services/usuariosService';

const misCalificacionesService = {
  obtenerResumen: (params) => apiClient.get('/mis-calificaciones/', { params }),
};

export default misCalificacionesService;
