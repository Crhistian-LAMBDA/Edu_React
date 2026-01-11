import apiClient from '../../usuarios/services/usuariosService';

const misCalificacionesService = {
  obtenerResumen: () => apiClient.get('/mis-calificaciones/'),
};

export default misCalificacionesService;
