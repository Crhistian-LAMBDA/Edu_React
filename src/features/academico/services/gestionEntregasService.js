import apiClient from '../../usuarios/services/usuariosService';

const gestionEntregasService = {
  /**
   * Listar entregas por grupo/materia/horario/profesor
   * @param {Object} params - { asignatura_id, horario, periodo_id, profesor_id }
   */
  listarEntregasPorGrupo: (params = {}) => {
    return apiClient.get('/gestion-entregas/entregas-por-grupo/', { params });
  },
};

export default gestionEntregasService;
