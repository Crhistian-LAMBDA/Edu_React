import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import entregasService from '../services/entregasService';
import { useAuth } from '../../../hooks/AuthContext';
import { useSearch } from '../../../shared/context/SearchContext';

export default function EntregasPage() {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const esEstudiante = user?.rol === 'estudiante';

  const [tareas, setTareas] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (esEstudiante) {
      cargarDatos();
    } else {
      setMessage({ type: 'info', text: 'Esta página es solo para estudiantes' });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esEstudiante]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resTareas, resEntregas] = await Promise.all([
        entregasService.listarTareasPublicadas(),
        entregasService.listar({ estudiante: user.id }),
      ]);

      setTareas(resTareas.data.results || resTareas.data);
      setEntregas(resEntregas.data.results || resEntregas.data);
    } catch (e) {
      console.error('Error cargando datos:', e);
      setMessage({ type: 'error', text: 'Error al cargar las tareas' });
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoTarea = (tarea) => {
    const entrega = entregas.find((e) => e.tarea === tarea.id);
    const ahora = new Date();
    const vencimiento = new Date(tarea.fecha_vencimiento);

    if (entrega) {
      if (entrega.estado_entrega === 'calificada') {
        return { label: 'Calificada', color: 'primary', entrega };
      }
      if (entrega.estado_entrega === 'tardia') {
        return { label: 'Entregada (Tardía)', color: 'warning', entrega };
      }
      return { label: 'Entregada', color: 'success', entrega };
    }

    if (ahora > vencimiento && !tarea.permite_entrega_tardia) {
      return { label: 'Vencida', color: 'error', entrega: null };
    }

    if (ahora > vencimiento && tarea.permite_entrega_tardia) {
      return { label: 'Pendiente (Tardía)', color: 'warning', entrega: null };
    }

    return { label: 'Pendiente', color: 'default', entrega: null };
  };

  const abrirDialogoEntrega = (tarea) => {
    const ahora = new Date();
    const vencimiento = new Date(tarea.fecha_vencimiento);

    if (ahora > vencimiento && !tarea.permite_entrega_tardia) {
      setMessage({
        type: 'error',
        text: 'Esta tarea ya venció y no permite entregas tardías',
      });
      return;
    }

    setTareaSeleccionada(tarea);
    setArchivo(null);
    setComentarios('');
    setOpenDialog(true);
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'El archivo no puede superar 10MB' });
      return;
    }

    // Validar extensión
    const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.txt'];
    const nombre = file.name.toLowerCase();
    const esValido = extensionesPermitidas.some((ext) => nombre.endsWith(ext));

    if (!esValido) {
      setMessage({
        type: 'error',
        text: `Solo se permiten archivos: ${extensionesPermitidas.join(', ')}`,
      });
      return;
    }

    setArchivo(file);
    setMessage({ type: '', text: '' });
  };

  const handleSubirEntrega = async () => {
    if (!archivo) {
      setMessage({ type: 'error', text: 'Debes seleccionar un archivo' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('tarea', tareaSeleccionada.id);
    formData.append('archivo_entrega', archivo);
    formData.append('comentarios_estudiante', comentarios);

    try {
      await entregasService.crear(formData);
      setMessage({ type: 'success', text: '¡Entrega realizada exitosamente!' });
      setOpenDialog(false);
      cargarDatos();
    } catch (error) {
      const errorMsg = error.response?.data?.tarea?.[0] || 'Error al subir la entrega';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    if (!searchTerm?.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      tarea.titulo?.toLowerCase().includes(term) ||
      tarea.asignatura_nombre?.toLowerCase().includes(term) ||
      tarea.asignatura_codigo?.toLowerCase().includes(term)
    );
  });

  const tareasAgrupadas = tareasFiltradas.reduce((grupos, tarea) => {
    const key = `${tarea.asignatura} - ${tarea.asignatura_nombre}`;
    if (!grupos[key]) {
      grupos[key] = {
        asignatura_id: tarea.asignatura,
        asignatura_nombre: tarea.asignatura_nombre,
        asignatura_codigo: tarea.asignatura_codigo,
        tareas: [],
      };
    }
    grupos[key].tareas.push(tarea);
    return grupos;
  }, {});

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (!esEstudiante) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Esta página es solo para estudiantes</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">Mis Tareas</Typography>
        </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

        {Object.keys(tareasAgrupadas).length === 0 ? (
          <Alert severity="info">No hay tareas publicadas en tus asignaturas</Alert>
        ) : (
          Object.entries(tareasAgrupadas).map(([key, grupo]) => (
            <Accordion key={key} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {grupo.asignatura_codigo} - {grupo.asignatura_nombre}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tarea</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Peso %</TableCell>
                        <TableCell>Vencimiento</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Calificación</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grupo.tareas.map((tarea) => {
                        const estado = obtenerEstadoTarea(tarea);
                        return (
                          <TableRow key={tarea.id}>
                            <TableCell>{tarea.titulo}</TableCell>
                            <TableCell>
                              <Chip label={tarea.tipo_tarea} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{tarea.peso_porcentual}%</TableCell>
                            <TableCell>
                              {new Date(tarea.fecha_vencimiento).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              <Chip label={estado.label} color={estado.color} size="small" />
                            </TableCell>
                            <TableCell>
                              {estado.entrega?.calificacion ? (
                                <Typography fontWeight="bold" color="primary">
                                  {estado.entrega.calificacion}/100
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {estado.entrega ? (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => entregasService.descargarArchivo(estado.entrega.archivo_entrega)}
                                  title="Descargar mi entrega"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<UploadFileIcon />}
                                  onClick={() => abrirDialogoEntrega(tarea)}
                                  disabled={estado.label === 'Vencida'}
                                >
                                  Entregar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))
        )}

      {/* Dialog para subir entrega */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Subir Entrega: {tareaSeleccionada?.titulo}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Asignatura: {tareaSeleccionada?.asignatura_nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vencimiento:{' '}
                  {tareaSeleccionada &&
                    new Date(tareaSeleccionada.fecha_vencimiento).toLocaleString('es-ES')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Peso: {tareaSeleccionada?.peso_porcentual}%
                </Typography>
              </CardContent>
            </Card>

            <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
              <UploadFileIcon sx={{ mr: 1 }} />
              {archivo ? archivo.name : 'Seleccionar archivo'}
              <input type="file" hidden onChange={handleArchivoChange} />
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
            startIcon={uploading ? null : <CheckCircleIcon />}
          >
            {uploading ? 'Subiendo...' : 'Subir Entrega'}
          </Button>
        </DialogActions>
      </Dialog>
      </Stack>
    </Container>
  );
}
