// Servicio para consumir API de matrículas
import apiClient from '../../usuarios/services/usuariosService';


const matriculasService = {
  listar: () => apiClient.get('/matriculas/'),
  matricular: (data) => apiClient.post('/matriculas/', data),
  disponibles: () => apiClient.get('/matriculas/disponibles/'),
  actualizarHorario: (id, data) => apiClient.patch(`/matriculas/${id}/`, data),
};

export default matriculasService;
