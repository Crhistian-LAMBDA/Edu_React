// Página para ver tareas publicadas de asignaturas matriculadas (solo estudiante)

import React, { useEffect, useState } from 'react';
import entregasService from '../../academico/services/entregasService';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import tareasService from '../../academico/services/tareasService';
import matriculasService from '../services/matriculasService';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Container,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
  Stack
} from '@mui/material';

import { toAbsoluteBackendUrl } from '../../../core/config/apiConfig';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


export default function MisTareasPage() {
  const [entregas, setEntregas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successEntrega, setSuccessEntrega] = useState('');
  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorEntrega, setErrorEntrega] = useState('');

  useEffect(() => {
    Promise.all([
      tareasService.listarEstudiante(),
      matriculasService.listar(),
      entregasService.listar()
    ])
      .then(([tareasRes, asignaturasRes, entregasRes]) => {
        const tareasData = Array.isArray(tareasRes.data) ? tareasRes.data : tareasRes.data.results || [];
        const asignaturasData = Array.isArray(asignaturasRes.data) ? asignaturasRes.data : asignaturasRes.data.results || [];
        const entregasData = Array.isArray(entregasRes.data) ? entregasRes.data : entregasRes.data.results || [];

        // Solo tareas visibles para estudiante: publicadas (ya visibles) o cerradas
        const tareasVisibles = (tareasData || []).filter((t) => {
          if (t?.estado === 'cerrada') return true;
          if (t?.estado !== 'publicada') return false;
          // Si el backend envía esta_publicada, la respetamos
          if (typeof t?.esta_publicada === 'boolean') return t.esta_publicada;
          return true;
        });

        // Filtrar solo asignaturas con horario asignado
        const asignaturasConHorario = asignaturasData.filter(m => m.horario && m.horario !== '' && m.horario !== null);
        setAsignaturas(asignaturasConHorario);
        setTareas(tareasVisibles);
        setEntregas(entregasData);
      })
      .catch(() => setError('No se pudieron cargar las tareas o asignaturas'))
      .finally(() => setLoading(false));
  }, []);
  const obtenerEntrega = (tareaId) => entregas.find(e => e.tarea === tareaId);

  const abrirDialogoEntrega = (tarea) => {
    setTareaSeleccionada(tarea);
    setArchivo(null);
    setComentarios('');
    setErrorEntrega('');
    setSuccessEntrega('');
    setOpenDialog(true);
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setArchivo(null);
      setErrorEntrega('El archivo no puede superar 10MB.');
      return;
    }
    const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.txt'];
    const nombre = file.name.toLowerCase();
    const esValido = extensionesPermitidas.some((ext) => nombre.endsWith(ext));
    if (!esValido) {
      setArchivo(null);
      setErrorEntrega('Formato no permitido. Usa PDF, DOC, DOCX, ZIP, RAR o TXT.');
      return;
    }
    setErrorEntrega('');
    setArchivo(file);
  };

  const handleSubirEntrega = async () => {
    if (!archivo) {
      setErrorEntrega('Debes seleccionar un archivo para enviar la entrega.');
      return;
    }

    // Validación rápida extra (sin depender solo del botón): vencimiento/cierre
    if (tareaSeleccionada?.estado === 'cerrada') {
      setErrorEntrega('Esta tarea está cerrada y ya no acepta entregas.');
      return;
    }
    if (tareaSeleccionada?.fecha_vencimiento) {
      const ahora = new Date();
      const vencimiento = new Date(tareaSeleccionada.fecha_vencimiento);
      if (vencimiento < ahora && !tareaSeleccionada?.permite_entrega_tardia) {
        setErrorEntrega('La tarea está vencida y no permite entregas tardías.');
        return;
      }
    }

    setUploading(true);
    setErrorEntrega('');
    setSuccessEntrega('');
    const formData = new FormData();
    formData.append('tarea', tareaSeleccionada.id);
    formData.append('archivo_entrega', archivo);
    formData.append('comentarios_estudiante', comentarios);
    try {
      await entregasService.crear(formData);
      setOpenDialog(false);
      setArchivo(null);
      setComentarios('');

      setSuccessEntrega('Entrega registrada exitosamente. El docente será notificado.');

      // Recargar entregas
      const entregasRes = await entregasService.listar();
      const entregasData = Array.isArray(entregasRes.data) ? entregasRes.data : entregasRes.data.results || [];
      setEntregas(entregasData);
    } catch (error) {
      let msg = 'Error al subir la entrega.';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          msg = error.response.data;
        } else if (typeof error.response.data === 'object') {
          msg = Object.values(error.response.data).join(' ');
        }
      }
      setErrorEntrega(msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Agrupar tareas por asignatura id
  const tareasPorAsignatura = asignaturas.reduce((acc, asig) => {
    acc[asig.asignatura.id] = tareas.filter(t => t.asignatura === asig.asignatura.id);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Mis Tareas Publicadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Entrega tus actividades, descarga adjuntos y revisa el estado de cada tarea.
          </Typography>
        </Box>

        {successEntrega && (
          <Alert severity="success">{successEntrega}</Alert>
        )}

        {asignaturas.length === 0 ? (
          <Alert severity="info">No tienes materias con horario asignado.</Alert>
        ) : (
          asignaturas.map(asig => (
            <Accordion key={asig.id} sx={{ overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {asig.asignatura.codigo} - {asig.asignatura.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      try {
                        const h = typeof asig.horario === 'string' ? JSON.parse(asig.horario) : asig.horario;
                        return `Día: ${h.dia || '-'} | Inicio: ${h.inicio || '-'} | Fin: ${h.fin || '-'}`;
                      } catch {
                        return asig.horario;
                      }
                    })()}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
              {tareasPorAsignatura[asig.asignatura.id] && tareasPorAsignatura[asig.asignatura.id].length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Título</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Publicación</TableCell>
                        <TableCell>Vencimiento</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Archivo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tareasPorAsignatura[asig.asignatura.id].map(t => {
                        const entrega = obtenerEntrega(t.id);
                        // Estado de vencimiento
                        const ahora = new Date();
                        const vencimiento = new Date(t.fecha_vencimiento);
                        const estaVencida = vencimiento < ahora;
                        const permiteTardia = t.permite_entrega_tardia;
                        const estaCerrada = t.estado === 'cerrada';
                        let estadoTarea = '';
                        let estadoColor = '';
                        if (entrega) {
                          estadoTarea = 'Entregada';
                          estadoColor = 'success.main';
                        } else if (estaCerrada) {
                          estadoTarea = 'Cerrada';
                          estadoColor = 'text.secondary';
                        } else if (estaVencida && !permiteTardia) {
                          estadoTarea = 'Vencida';
                        } else if (estaVencida && permiteTardia) {
                          estadoTarea = 'Entrega tardía';
                          estadoColor = 'warning.main';
                        } else {
                          estadoTarea = 'Vigente';
                          estadoColor = 'primary.main';
                        }
                        return (
                          <TableRow key={t.id} hover>
                            <TableCell>
                              <strong>{t.titulo}</strong>
                            </TableCell>
                            <TableCell>
                              <span>{t.descripcion}</span>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {t.fecha_publicacion
                                  ? new Date(t.fecha_publicacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
                                  : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(t.fecha_vencimiento).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: estadoColor, fontWeight: 600 }}>
                                {estadoTarea}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {t.archivo_adjunto ? (
                                <Link href={toAbsoluteBackendUrl(t.archivo_adjunto)} target="_blank" rel="noopener noreferrer">
                                  Descargar adjunto
                                </Link>
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                              {/* Entrega del estudiante */}
                              {entrega ? (
                                <Box mt={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    href={toAbsoluteBackendUrl(entrega.archivo_entrega)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Mi entrega
                                  </Button>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {(() => {
                                      const cal = entrega.calificacion;
                                      const calText = (cal === null || cal === undefined) ? '' : ` | Nota: ${cal}`;
                                      return `Estado: ${entrega.estado_entrega}${calText}`;
                                    })()}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box mt={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<UploadFileIcon />}
                                    onClick={() => abrirDialogoEntrega(t)}
                                    disabled={estaCerrada || (estaVencida && !permiteTardia)}
                                  >
                                    Entregar
                                  </Button>
                                  {estaCerrada && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      La tarea está cerrada y ya no acepta entregas.
                                    </Typography>
                                  )}
                                  {(estaVencida && !permiteTardia) && (
                                    <Typography variant="caption" color="error" display="block">
                                      La tarea está vencida y no permite entregas tardías.
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                          {/* Dialog para subir entrega */}
                          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>
                              Subir Entrega: {tareaSeleccionada?.titulo}
                            </DialogTitle>
                            <DialogContent>
                              <Box sx={{ mt: 2 }}>
                                {errorEntrega && (
                                  <Alert severity="error" sx={{ mb: 2 }}>{errorEntrega}</Alert>
                                )}

                                {tareaSeleccionada?.fecha_vencimiento && tareaSeleccionada?.permite_entrega_tardia && (() => {
                                  try {
                                    const ahora = new Date();
                                    const venc = new Date(tareaSeleccionada.fecha_vencimiento);
                                    if (venc < ahora) {
                                      return (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                          Esta entrega se registrará como tardía.
                                        </Alert>
                                      );
                                    }
                                  } catch {
                                    // ignore
                                  }
                                  return null;
                                })()}

                                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
                                  <UploadFileIcon sx={{ mr: 1 }} />
                                  {archivo ? archivo.name : 'Seleccionar archivo'}
                                  <input
                                    type="file"
                                    hidden
                                    accept=".pdf,.doc,.docx,.zip,.rar,.txt"
                                    onChange={handleArchivoChange}
                                  />
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                  Formatos permitidos: PDF, DOC, DOCX, ZIP, RAR, TXT (máx. 10MB)
                                </Typography>
                                <TextField
                                  label="Comentarios (opcional)"
                                  multiline
                                  rows={4}
                                  fullWidth
                                  value={comentarios}
                                  onChange={(e) => setComentarios(e.target.value)}
                                  placeholder="Añade comentarios sobre tu entrega..."
                                />
                              </Box>
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={() => setOpenDialog(false)} disabled={uploading}>
                                Cancelar
                              </Button>
                              <Button
                                variant="contained"
                                onClick={handleSubirEntrega}
                                disabled={!archivo || uploading}
                                startIcon={uploading ? null : <UploadFileIcon />}
                              >
                                {uploading ? 'Subiendo...' : 'Subir Entrega'}
                              </Button>
                            </DialogActions>
                          </Dialog>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">No hay tareas programadas para esta materia.</Typography>
              )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Stack>
    </Container>
  );
}
