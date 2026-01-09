// Página para ver tareas publicadas de asignaturas matriculadas (solo estudiante)

import React, { useEffect, useState } from 'react';
import tareasService from '../../academico/services/tareasService';
import matriculasService from '../services/matriculasService';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function MisTareasPage() {
  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      tareasService.listarEstudiante(),
      matriculasService.listar()
    ])
      .then(([tareasRes, asignaturasRes]) => {
        const tareasData = Array.isArray(tareasRes.data) ? tareasRes.data : tareasRes.data.results || [];
        const asignaturasData = Array.isArray(asignaturasRes.data) ? asignaturasRes.data : asignaturasRes.data.results || [];
        // Filtrar solo asignaturas con horario asignado
        const asignaturasConHorario = asignaturasData.filter(m => m.horario && m.horario !== '' && m.horario !== null);
        setAsignaturas(asignaturasConHorario);
        setTareas(tareasData);
      })
      .catch(() => setError('No se pudieron cargar las tareas o asignaturas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Agrupar tareas por asignatura id
  const tareasPorAsignatura = asignaturas.reduce((acc, asig) => {
    acc[asig.asignatura.id] = tareas.filter(t => t.asignatura === asig.asignatura.id);
    return acc;
  }, {});

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>Mis Tareas Publicadas</Typography>
      {asignaturas.length === 0 ? (
        <Alert severity="info">No tienes materias con horario asignado.</Alert>
      ) : (
        asignaturas.map(asig => (
          <Accordion key={asig.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {asig.asignatura.codigo} - {asig.asignatura.nombre}
              </Typography>
              <Box ml={2}>
                <Typography variant="body2" color="primary">
                  {(() => {
                    try {
                      const h = typeof asig.horario === 'string' ? JSON.parse(asig.horario) : asig.horario;
                      return `Día: ${h.dia || '-'} | Inicio: ${h.inicio || '-'} | Fin: ${h.fin || '-'}`;
                    } catch {
                      return asig.horario;
                    }
                  })()}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {tareasPorAsignatura[asig.asignatura.id] && tareasPorAsignatura[asig.asignatura.id].length > 0 ? (
                <ul>
                  {tareasPorAsignatura[asig.asignatura.id].map(t => (
                    <li key={t.id}>
                      <strong>{t.titulo}</strong> ({t.fecha_vencimiento})
                      <br />
                      <span>{t.descripcion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay tareas programadas para esta materia.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}
