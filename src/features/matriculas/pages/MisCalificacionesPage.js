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
  MenuItem,
  Paper,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
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
  const [baseData, setBaseData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setInitialLoading(true);
      setError('');
      try {
        const res = await misCalificacionesService.obtenerResumen();
        if (!mounted) return;
        setData(res.data);
        setBaseData(res.data);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar tus calificaciones.');
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cuando cambian filtros, pedir al backend si hay filtros activos.
  // Si están vacíos, volver a la data base (sin re-consultar).
  useEffect(() => {
    let mounted = true;
    const hasFilters = Boolean(periodoId) || Boolean(asignaturaId);

    if (!hasFilters) {
      if (baseData) setData(baseData);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      setFilterLoading(true);
      setError('');
      try {
        const params = {};
        if (periodoId) params.periodo_id = periodoId;
        if (asignaturaId) params.asignatura_id = asignaturaId;
        const res = await misCalificacionesService.obtenerResumen(params);
        if (mounted) setData(res.data);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar tus calificaciones con los filtros seleccionados.');
      } finally {
        if (mounted) setFilterLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [periodoId, asignaturaId, baseData]);

  const objetivo = data?.objetivo_aprobacion ?? 60;
  const asignaturas = useMemo(() => data?.asignaturas ?? [], [data]);

  // Opciones: se basan en la data inicial para no “perder” opciones al filtrar.
  const baseAsignaturas = useMemo(() => baseData?.asignaturas ?? [], [baseData]);

  const periodos = useMemo(() => {
    const map = new Map();
    for (const a of baseAsignaturas) {
      const p = a?.periodo;
      if (!p?.id) continue;
      map.set(String(p.id), { id: String(p.id), nombre: p.nombre || String(p.id) });
    }
    return Array.from(map.values()).sort((x, y) => (x.nombre || '').localeCompare(y.nombre || ''));
  }, [baseAsignaturas]);

  const asignaturasOpts = useMemo(() => {
    return (baseAsignaturas || [])
      .map((a) => a?.asignatura)
      .filter((x) => x?.id)
      .map((x) => ({ id: String(x.id), label: `${x.codigo || ''} - ${x.nombre || ''}`.trim() }));
  }, [baseAsignaturas]);

  // La lista que se muestra ya viene filtrada desde backend cuando hay filtros.
  const asignaturasFiltradas = useMemo(() => asignaturas || [], [asignaturas]);

  const hayDatos = asignaturasFiltradas.length > 0;

  const resumenGeneral = useMemo(() => {
    if (!hayDatos) return null;
    const totalActual = asignaturasFiltradas.reduce((acc, a) => acc + (a?.resumen?.nota_actual_ponderada ?? 0), 0);
    return {
      totalActual: Math.round(totalActual * 100) / 100,
    };
  }, [asignaturasFiltradas, hayDatos]);

  if (initialLoading) {
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
              {filterLoading ? <LinearProgress /> : null}
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                <TextField
                  select
                  label="Filtrar por período"
                  value={periodoId}
                  onChange={(e) => setPeriodoId(e.target.value)}
                  size="small"
                  disabled={filterLoading}
                  fullWidth
                >
                  <MenuItem value="">Todos</MenuItem>
                  {periodos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Filtrar por asignatura"
                  value={asignaturaId}
                  onChange={(e) => setAsignaturaId(e.target.value)}
                  size="small"
                  disabled={filterLoading}
                  fullWidth
                >
                  <MenuItem value="">Todas</MenuItem>
                  {asignaturasOpts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Mostrando: {asignaturasFiltradas.length} materia(s)
              </Typography>
              {resumenGeneral && (
                <Typography variant="body2">
                  Suma de notas ponderadas (todas las materias): {resumenGeneral.totalActual}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {asignaturasFiltradas.map((a) => {
          const asig = a.asignatura;
          const docentes = a.docentes || [];
          const horarioObj = parseHorario(a.horario);
          const tareas = a.tareas || [];
          const resumen = a.resumen || {};
          const periodo = a.periodo;

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
                    {periodo?.nombre ? <Chip size="small" label={`Período: ${periodo.nombre}`} /> : null}
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
                      <TableCell>Tipo</TableCell>
                      <TableCell>Peso (%)</TableCell>
                      <TableCell>Nota</TableCell>
                      <TableCell>Aporte ponderado</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Retroalimentación</TableCell>
                      <TableCell>Adjunto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tareas.map((t) => {
                      const peso = t.peso_porcentual ?? 0;
                      const cal = t.entrega?.nota ?? t.entrega?.calificacion;
                      const aporte = cal === null || cal === undefined ? null : (cal * (peso / 100));
                      const estadoCal = t.entrega?.estado_calificacion ?? t.entrega?.estado_entrega;
                      const retro = t.entrega?.retroalimentacion_docente ?? t.entrega?.comentarios_docente;
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
                          <TableCell>{t.tipo_tarea || '—'}</TableCell>
                          <TableCell>{peso}</TableCell>
                          <TableCell>{cal === null || cal === undefined ? '—' : cal}</TableCell>
                          <TableCell>{aporte === null ? '—' : Math.round(aporte * 100) / 100}</TableCell>
                          <TableCell>{estadoCal || '—'}</TableCell>
                          <TableCell>{retro || '—'}</TableCell>
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
                      <TableCell colSpan={4}>
                        <Typography fontWeight={700}>Total ponderado actual</Typography>
                      </TableCell>
                      <TableCell colSpan={4}>
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
