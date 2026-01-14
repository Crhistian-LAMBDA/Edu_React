import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Link,
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
import misCalificacionesService from '../services/misCalificacionesService';
import { toAbsoluteBackendUrl } from '../../../core/config/apiConfig';

const parseHorario = (horario) => {
  if (!horario) return null;
  if (typeof horario === 'object') return horario;
  try {
    return JSON.parse(horario);
  } catch {
    return null;
  }
};

export default function MisCalificacionesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await misCalificacionesService.obtenerResumen();
        if (mounted) setData(res.data);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar tus calificaciones.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const objetivo = data?.objetivo_aprobacion ?? 60;
  const asignaturas = useMemo(() => data?.asignaturas ?? [], [data]);

  const hayDatos = asignaturas.length > 0;

  const resumenGeneral = useMemo(() => {
    if (!hayDatos) return null;
    const totalActual = asignaturas.reduce((acc, a) => acc + (a?.resumen?.nota_actual_ponderada ?? 0), 0);
    return {
      totalActual: Math.round(totalActual * 100) / 100,
    };
  }, [asignaturas, hayDatos]);

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

  if (!hayDatos) {
    return <Alert severity="info">No tienes materias con horario asignado o aún no hay tareas/calificaciones registradas.</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Mis Calificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa tu avance por materia, peso evaluado y objetivo de aprobación.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Resumen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Objetivo de aprobación: {objetivo}
              </Typography>
              {resumenGeneral && (
                <Typography variant="body2">
                  Suma de notas ponderadas (todas las materias): {resumenGeneral.totalActual}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {asignaturas.map((a) => {
          const asig = a.asignatura;
          const docentes = a.docentes || [];
          const horarioObj = parseHorario(a.horario);
          const tareas = a.tareas || [];
          const resumen = a.resumen || {};

          const notaActual = resumen.nota_actual_ponderada ?? 0;
          const pesoCalificado = resumen.peso_calificado ?? 0;
          const pesoRestante = resumen.peso_restante ?? 0;
          const requerido = resumen.requerido_promedio_en_restante_para_ganar;

          const progresoObjetivo = Math.min(100, Math.max(0, (notaActual / objetivo) * 100));

          return (
            <Accordion key={a.matricula_id} defaultExpanded={false} sx={{ overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.75} sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {asig?.codigo} - {asig?.nombre}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {docentes.length > 0 ? (
                      docentes.map((d) => (
                        <Chip key={d.id} size="small" label={`Docente: ${d.nombre}`} />
                      ))
                    ) : (
                      <Chip size="small" label="Docente: (no asignado)" />
                    )}
                    {horarioObj ? (
                      <Chip
                        size="small"
                        label={`Horario: ${horarioObj.dia || '-'} ${horarioObj.inicio || '-'}-${horarioObj.fin || '-'}`}
                      />
                    ) : (
                      <Chip size="small" label={`Horario: ${a.horario || '-'}`} />
                    )}
                  </Box>
                </Stack>
              </AccordionSummary>

            <AccordionDetails>
              <Box mb={2}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Estado de la materia
                  </Typography>

                  <Box mb={1}>
                    <Typography variant="body2">Nota ponderada actual: {notaActual}</Typography>
                    <LinearProgress variant="determinate" value={progresoObjetivo} sx={{ mt: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Progreso hacia {objetivo}
                    </Typography>
                  </Box>

                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                    <Box>
                      <Typography variant="body2">Peso calificado: {pesoCalificado}%</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, pesoCalificado))} sx={{ mt: 0.5 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2">Peso restante: {pesoRestante}%</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, pesoRestante))} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>

                  <Box mt={1}>
                    {requerido === null || requerido === undefined ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay peso restante para calcular el requerido.
                      </Typography>
                    ) : requerido > 100 ? (
                      <Typography variant="body2" color="error">
                        Para ganar necesitarías un promedio {requerido} en lo restante (no es posible). Revisa con el docente.
                      </Typography>
                    ) : (
                      <Typography variant="body2">
                        Promedio requerido en lo restante para ganar: {requerido}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Detalle de tareas
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarea</TableCell>
                      <TableCell>Peso (%)</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell>Aporte ponderado</TableCell>
                      <TableCell>Adjunto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tareas.map((t) => {
                      const peso = t.peso_porcentual ?? 0;
                      const cal = t.entrega?.calificacion;
                      const aporte = cal === null || cal === undefined ? null : (cal * (peso / 100));
                      return (
                        <TableRow key={t.id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{t.titulo}</Typography>
                            {t.descripcion ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {t.descripcion}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>{peso}</TableCell>
                          <TableCell>{cal === null || cal === undefined ? '—' : cal}</TableCell>
                          <TableCell>{aporte === null ? '—' : Math.round(aporte * 100) / 100}</TableCell>
                          <TableCell>
                            {t.archivo_adjunto ? (
                              <Link href={toAbsoluteBackendUrl(t.archivo_adjunto)} target="_blank" rel="noopener noreferrer">
                                Ver adjunto
                              </Link>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography fontWeight={700}>Total ponderado actual</Typography>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <Typography fontWeight={700}>{notaActual}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Container>
  );
}
