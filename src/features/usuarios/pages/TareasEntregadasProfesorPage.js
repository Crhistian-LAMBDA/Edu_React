import React, { useState } from 'react';
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  Container,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import GradeIcon from '@mui/icons-material/Grade';
import VisibilityIcon from '@mui/icons-material/Visibility';




import { entregasStyles } from './entregasStyles';

import AutocompleteAsignatura from '../../academico/components/AutocompleteAsignatura';
import AutocompletePeriodo from '../../academico/components/AutocompletePeriodo';
import entregasService from '../../academico/services/entregasService';
import './entregasCustomFields.css';
import { toAbsoluteBackendUrl } from '../../../core/config/apiConfig';
// ...otros imports...

function TareasEntregadasProfesorPage() {

  // const { user } = useAuth(); // Si se necesita, descomentar
  // Estados principales para filtros y datos
  const [periodoId, setPeriodoId] = useState(null);
  const [asignaturaId, setAsignaturaId] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para el modal de calificación
  const [openCalificar, setOpenCalificar] = useState(false);
  const [calificarEntrega, setCalificarEntrega] = useState(null);
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');

  // Lógica para agrupar entregas por asignatura
  const entregasPorAsignatura = entregas.reduce((acc, entrega) => {
    const asigId = entrega.asignatura_id;
    if (!acc[asigId]) acc[asigId] = [];
    acc[asigId].push(entrega);
    return acc;
  }, {});

  // Handler para buscar entregas
  const handleBuscarEntregas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (periodoId) params.periodo = periodoId;
      if (asignaturaId) params.asignatura = asignaturaId;
      const { data } = await entregasService.listar(params);
      setEntregas(data.results || data);
    } catch (err) {
      setError('Error al cargar entregas.');
    } finally {
      setLoading(false);
    }
  };
  const handleOpenCalificar = (entrega) => {
    setCalificarEntrega(entrega);
    setNota(entrega?.calificacion ?? '');
    setComentario(entrega?.comentarios_docente ?? '');
    setOpenCalificar(true);
  };
  const handleCloseCalificar = () => {
    setOpenCalificar(false);
    setCalificarEntrega(null);
    setNota('');
    setComentario('');
  };
  const handleGuardarCalificacion = async () => {
    if (!calificarEntrega) return;
    setLoading(true);
    setError(null);
    try {
      const notaNormalizada = String(nota ?? '').trim().replace(',', '.');
      const calificacionNum = parseFloat(notaNormalizada);
      if (Number.isNaN(calificacionNum)) {
        setError('La nota debe ser un número (ej: 85.5).');
        return;
      }
      const { data } = await entregasService.calificar(calificarEntrega.id, {
        calificacion: calificacionNum,
        comentarios_docente: comentario,
      });

      const entregaActualizada = data?.entrega ?? data;
      if (entregaActualizada?.id) {
        setEntregas((prev) =>
          prev.map((e) => (e.id === entregaActualizada.id ? { ...e, ...entregaActualizada } : e))
        );
      }

      handleCloseCalificar();
      // Refrescar entregas con los filtros actuales
      await handleBuscarEntregas();
    } catch (err) {
      setError('Error al guardar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Entregas de Estudiantes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona un período y/o asignatura y haz clic en Buscar para ver las entregas.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="flex-start">
            <Grid item xs={12} sm={4} md={3}>
              <AutocompletePeriodo value={periodoId} onChange={setPeriodoId} />
            </Grid>
            <Grid item xs={12} sm={5} md={5}>
              <AutocompleteAsignatura value={asignaturaId} onChange={setAsignaturaId} />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{ height: 44, fontWeight: 700 }}
                onClick={handleBuscarEntregas}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Divider />

        {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {!loading && !error && entregas.length === 0 && (
          <Alert severity="info">
            No hay entregas para los filtros seleccionados.
          </Alert>
        )}

        {/* Resultados: acordeón de entregas por asignatura */}
        {Object.keys(entregasPorAsignatura).map(asigId => {
          const entregasAsig = entregasPorAsignatura[asigId];
          const asigNombre = entregasAsig[0]?.asignatura_nombre || 'Asignatura';
          return (
            <Accordion key={asigId} sx={entregasStyles.acordeon}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700}>{asigNombre}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Table size="small">
                  <TableHead sx={entregasStyles.tableHead}>
                    <TableRow>
                      <TableCell>Estudiante</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Tarea</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Archivo</TableCell>
                      <TableCell>Calificación</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entregasAsig.map(ent => (
                      (() => {
                        const estadoEntrega = ent.estado_entrega ?? ent.estado;
                        const calificacionEntrega = ent.calificacion ?? null;
                        const archivoEntrega = ent.archivo || ent.archivo_entrega || ent.file || ent.url;
                        return (
                      <TableRow key={ent.id} sx={entregasStyles.tableRow}>
                        <TableCell sx={entregasStyles.estudiante}>{ent.estudiante_nombre}</TableCell>
                        <TableCell>{ent.estudiante_email}</TableCell>
                        <TableCell>{ent.tarea_titulo}</TableCell>
                        <TableCell>
                          <Chip
                            label={estadoEntrega}
                            sx={estadoEntrega === 'entregado' ? entregasStyles.chipEntregado : entregasStyles.chipPendiente}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {archivoEntrega ? (
                            <Tooltip title="Descargar archivo">
                              <IconButton
                                component="a"
                                href={toAbsoluteBackendUrl(archivoEntrega)}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                color="primary"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          ) : <Chip label="Sin archivo" size="small" color="default" />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={calificacionEntrega ?? '-'}
                            color={calificacionEntrega !== null ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center" sx={entregasStyles.acciones}>
                          <Tooltip title="Ver detalles">
                            <IconButton color="primary" size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Calificar">
                            <IconButton color="secondary" size="small" onClick={() => handleOpenCalificar(ent)}>
                              <GradeIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                        );
                      })()
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {/* Modal para calificar */}
      <Dialog open={openCalificar} onClose={handleCloseCalificar} maxWidth="xs" fullWidth>
        <DialogTitle>Calificar Entrega</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            <strong>Tarea:</strong> {calificarEntrega?.tarea_titulo}
          </Typography>
          <TextField
            label="Nota"
            type="number"
            value={nota}
            onChange={e => setNota(e.target.value)}
            inputProps={{ step: '0.01', min: 0, max: 100 }}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Comentario"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCalificar}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarCalificacion}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TareasEntregadasProfesorPage;
