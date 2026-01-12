import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import staffCalificacionesService from '../services/staffCalificacionesService';
import { useSearch } from '../../../shared/context/SearchContext';

const safeLower = (v) => (v ?? '').toString().toLowerCase();

const matchTerm = (term, ...values) => {
  if (!term) return true;
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return values.some((v) => safeLower(v).includes(t));
};

export default function CalificacionesStaffPage() {
  const { searchTerm } = useSearch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await staffCalificacionesService.obtenerResumen();
        if (mounted) setData(res.data);
      } catch (e) {
        if (!mounted) return;
        const status = e?.response?.status;
        const detail = e?.response?.data?.detail;
        if (status === 403) {
          setError('No tienes permisos para ver esta sección.');
        } else if (status === 400 && detail) {
          setError(detail);
        } else {
          setError('No se pudieron cargar las calificaciones del staff.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const periodoNombre = data?.periodo?.nombre || '';
  const asignaturasRaw = useMemo(() => data?.asignaturas ?? [], [data]);

  const asignaturas = useMemo(() => {
    const term = (searchTerm || '').trim();
    if (!term) return asignaturasRaw;

    return asignaturasRaw
      .map((a) => {
        const asig = a.asignatura;
        const tareas = a.tareas || [];
        const estudiantes = a.estudiantes || [];

        const estudiantesFiltrados = estudiantes.filter((e) =>
          matchTerm(
            term,
            e?.nombre,
            e?.username,
            e?.email,
            e?.carrera?.nombre,
            asig?.codigo,
            asig?.nombre,
          ),
        );

        const coincideAsignaturaOTarea =
          matchTerm(term, asig?.codigo, asig?.nombre) ||
          tareas.some((t) => matchTerm(term, t?.titulo, t?.tipo_tarea, t?.estado));

        if (!coincideAsignaturaOTarea && estudiantesFiltrados.length === 0) return null;

        return {
          ...a,
          estudiantes: coincideAsignaturaOTarea ? estudiantes : estudiantesFiltrados,
        };
      })
      .filter(Boolean);
  }, [asignaturasRaw, searchTerm]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!asignaturas.length) {
    return <Alert severity="info">No hay materias con docente asignado (o no tienes acceso) para el período actual.</Alert>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Notas por materia
          </Typography>
          {periodoNombre ? (
            <Typography variant="body2" color="text.secondary">
              Período: {periodoNombre}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            Selecciona una materia para ver la lista de estudiantes matriculados y sus notas.
          </Typography>
        </Box>

        {asignaturas.map((a) => {
          const asig = a.asignatura;
          const docentes = a.docentes || [];
          const tareas = a.tareas || [];
          const estudiantes = a.estudiantes || [];

          return (
            <Accordion key={asig?.id} defaultExpanded={false} sx={{ overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.75} sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {asig?.codigo} - {asig?.nombre}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip size="small" label={`Estudiantes: ${estudiantes.length}`} />
                    <Chip size="small" label={`Tareas: ${tareas.length}`} />
                    {docentes.length > 0 ? (
                      docentes.map((d) => <Chip key={d.id} size="small" label={`Docente: ${d.nombre}`} />)
                    ) : (
                      <Chip size="small" label="Docente: (no asignado)" />
                    )}
                  </Box>
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                {estudiantes.length === 0 ? (
                  <Alert severity="info">Esta materia no tiene estudiantes matriculados en el período seleccionado.</Alert>
                ) : null}

                {estudiantes.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Estudiante</TableCell>
                          <TableCell>Carrera</TableCell>
                          <TableCell>Nota actual</TableCell>
                          <TableCell>Peso calificado</TableCell>
                          <TableCell>Notas por tarea</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estudiantes.map((e) => {
                          const resumen = e.resumen || {};
                          const nota = resumen.nota_actual_ponderada ?? 0;
                          const peso = resumen.peso_calificado ?? 0;
                          const calMap = e.calificaciones_por_tarea || {};

                          return (
                            <TableRow key={e.id} hover>
                              <TableCell>
                                <Typography fontWeight={700}>{e.nombre}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {e.email || e.username}
                                </Typography>
                              </TableCell>
                              <TableCell>{e.carrera?.nombre || '—'}</TableCell>
                              <TableCell>{nota}</TableCell>
                              <TableCell>{peso}%</TableCell>
                              <TableCell>
                                {tareas.length === 0 ? (
                                  '—'
                                ) : (
                                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                    {tareas.map((t) => {
                                      const cal = calMap[String(t.id)];
                                      return (
                                        <Chip
                                          key={t.id}
                                          size="small"
                                          label={`${t.titulo}: ${cal === null || cal === undefined ? '—' : cal}`}
                                        />
                                      );
                                    })}
                                  </Stack>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : null}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Container>
  );
}
