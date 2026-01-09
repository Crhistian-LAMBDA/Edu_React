import api from '../../../core/api';

const matriculasService = {
  listar: (params) => api.get('/matriculas/', { params }),
  crear: (data) => api.post('/matriculas/', data),
  eliminar: (id) => api.delete(`/matriculas/${id}/`),
  actualizar: (id, data) => api.put(`/matriculas/${id}/`, data),
};

export default matriculasService;
