import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import tareasService from '../services/tareasService';
import { useAuth } from '../../../hooks/AuthContext';
import { useSearch } from '../../../shared/context/SearchContext';

const defaultForm = {
  asignatura: '',
  titulo: '',
  descripcion: '',
  tipo_tarea: 'tarea',
  peso_porcentual: 0,
  fecha_publicacion: '',
  fecha_vencimiento: '',
  estado: 'borrador',
  permite_entrega_tardia: false,
};

export default function TareasPage() {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const esDocente = ['profesor', 'docente', 'coordinador', 'admin', 'super_admin'].includes(user?.rol);

  const [tareas, setTareas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pesosPorAsignatura, setPesosPorAsignatura] = useState({});
  
  // Filtros estáticos (no implementados aún)
  const filterAsignatura = '';
  const filterTipo = '';
  const filterEstado = '';

  useEffect(() => {
    if (esDocente) {
      cargarDatos();
      cargarAsignaturas();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esDocente]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAsignatura) params.asignatura = filterAsignatura;
      if (filterTipo) params.tipo_tarea = filterTipo;
      if (filterEstado) params.estado = filterEstado;

      const res = await tareasService.listar(params);
      setTareas(res.data.results || res.data);
      
      // Cargar pesos por asignatura
      cargarPesosAsignaturas(res.data.results || res.data);
    } catch (e) {
      console.error('Error cargando tareas:', e);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignaturas = async () => {
    try {
      const res = await tareasService.listarAsignaturas();
      setAsignaturas(res.data.results || res.data);
    } catch (e) {
      console.error('Error cargando asignaturas:', e);
    }
  };

  const cargarPesosAsignaturas = async (tareasList) => {
    const asignaturaIds = [...new Set(tareasList.map(t => t.asignatura))];
    const pesos = {};

    for (const asigId of asignaturaIds) {
      try {
        const res = await tareasService.pesoAsignatura(asigId);
        pesos[asigId] = res.data;
      } catch (e) {
        pesos[asigId] = { peso_total: 0, peso_disponible: 100, completo: false };
      }
    }
    
    setPesosPorAsignatura(pesos);
  };

  const tareasFiltradas = useMemo(() => {
    let resultado = tareas;

    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(t =>
        t.titulo?.toLowerCase().includes(term) ||
        t.descripcion?.toLowerCase().includes(term) ||
        t.asignatura_nombre?.toLowerCase().includes(term) ||
        t.asignatura_codigo?.toLowerCase().includes(term)
      );
    }

    return resultado;
  }, [tareas, searchTerm]);

  const tareasAgrupadas = useMemo(() => {
    const grupos = {};
    tareasFiltradas.forEach(t => {
      const key = `${t.asignatura} - ${t.asignatura_nombre}`;
      if (!grupos[key]) {
        grupos[key] = {
          asignatura_id: t.asignatura,
          asignatura_nombre: t.asignatura_nombre,
          asignatura_codigo: t.asignatura_codigo,
          tareas: []
        };
      }
      grupos[key].tareas.push(t);
    });
    return grupos;
  }, [tareasFiltradas]);

  const abrirCrear = () => {
    setForm(defaultForm);
    setEditing(null);
    setOpen(true);
  };

  const formatearFechaInput = (fechaIso) => {
    // Convierte "2026-01-04T21:13:00-05:00" a "2026-01-04T21:13"
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const abrirEditar = (tarea) => {
    setEditing(tarea);
    setForm({
      asignatura: tarea.asignatura,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      tipo_tarea: tarea.tipo_tarea,
      peso_porcentual: tarea.peso_porcentual,
      fecha_publicacion: formatearFechaInput(tarea.fecha_publicacion),
      fecha_vencimiento: formatearFechaInput(tarea.fecha_vencimiento),
      estado: tarea.estado,
      permite_entrega_tardia: tarea.permite_entrega_tardia || false,
    });
    setOpen(true);
  };

  const cerrarDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validarFormulario = () => {
    if (!form.asignatura) {
      setMessage({ type: 'error', text: 'Debe seleccionar una asignatura' });
      return false;
    }
    if (!form.titulo?.trim() || form.titulo.trim().length < 5) {
      setMessage({ type: 'error', text: 'El título debe tener al menos 5 caracteres' });
      return false;
    }
    if (!form.fecha_publicacion) {
      setMessage({ type: 'error', text: 'Debe indicar fecha de publicación' });
      return false;
    }
    if (!form.fecha_vencimiento) {
      setMessage({ type: 'error', text: 'Debe indicar fecha de vencimiento' });
      return false;
    }
    if (new Date(form.fecha_vencimiento) <= new Date(form.fecha_publicacion)) {
      setMessage({ type: 'error', text: 'Fecha de vencimiento debe ser posterior a publicación' });
      return false;
    }
    if (form.peso_porcentual < 0 || form.peso_porcentual > 100) {
      setMessage({ type: 'error', text: 'El peso debe estar entre 0 y 100' });
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!validarFormulario()) return;

    try {
      if (editing) {
        await tareasService.actualizar(editing.id, form);
        setMessage({ type: 'success', text: 'Tarea actualizada exitosamente' });
      } else {
        await tareasService.crear(form);
        setMessage({ type: 'success', text: 'Tarea creada exitosamente' });
      }
      
      await cargarDatos();
      cerrarDialog();
      setTimeout(() => setMessage({ type: '', text: '' }), 2500);
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.response?.data?.peso_porcentual?.[0] || 'Error al guardar tarea';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  const eliminarTarea = async (id, titulo) => {
    if (window.confirm(`¿Eliminar tarea "${titulo}"?`)) {
      try {
        await tareasService.eliminar(id);
        setMessage({ type: 'success', text: 'Tarea eliminada' });
        await cargarDatos();
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (e) {
        setMessage({ type: 'error', text: 'No se pudo eliminar la tarea' });
      }
    }
  };

  const publicarTarea = async (id, titulo) => {
    if (window.confirm(`¿Publicar tarea "${titulo}"?\nSe notificará a los estudiantes inscritos.`)) {
      try {
        await tareasService.publicar(id);
        setMessage({ type: 'success', text: 'Tarea publicada. Estudiantes notificados por email' });
        await cargarDatos();
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (e) {
        setMessage({ type: 'error', text: 'Error al publicar tarea' });
      }
    }
  };

  const cerrarTarea = async (id, titulo) => {
    if (window.confirm(`¿Cerrar tarea "${titulo}"?\nLos estudiantes no podrán enviar más trabajos.`)) {
      try {
        await tareasService.cerrar(id);
        setMessage({ type: 'success', text: 'Tarea cerrada' });
        await cargarDatos();
        setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      } catch (e) {
        setMessage({ type: 'error', text: 'Error al cerrar tarea' });
      }
    }
  };

  const obtenerColorPeso = (pesoTotal) => {
    if (pesoTotal === 100) return '#4caf50'; // verde
    if (pesoTotal < 100) return '#ff9800'; // naranja
    return '#f44336'; // rojo
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'publicada': return 'success';
      case 'borrador': return 'warning';
      case 'cerrada': return 'error';
      default: return 'default';
    }
  };

  if (!esDocente) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">No tienes permisos para acceder a esta página</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Tareas y Exámenes</Typography>
        {esDocente && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Nueva Tarea
          </Button>
        )}
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {loading && <Typography>Cargando...</Typography>}

      {!loading && Object.keys(tareasAgrupadas).length === 0 && (
        <Alert severity="info">No hay tareas creadas aún</Alert>
      )}

      {!loading && Object.entries(tareasAgrupadas).map(([key, grupo]) => {
        const pesoInfo = pesosPorAsignatura[grupo.asignatura_id] || { peso_total: 0, peso_disponible: 100, completo: false };
        const pesoTotal = pesoInfo.peso_total || 0;

        return (
          <Accordion key={key} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {grupo.asignatura_codigo} - {grupo.asignatura_nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ width: 200, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pesoTotal, 100)}
                        sx={{
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: obtenerColorPeso(pesoTotal)
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: obtenerColorPeso(pesoTotal) }}>
                      {pesoTotal}% / 100%
                    </Typography>
                    {pesoTotal > 100 && (
                      <Chip label={`Excede ${pesoTotal - 100}%`} color="error" size="small" />
                    )}
                    {pesoTotal < 100 && pesoTotal > 0 && (
                      <Chip label={`Falta ${100 - pesoTotal}%`} color="warning" size="small" />
                    )}
                  </Box>
                </Box>
                <Chip label={`${grupo.tareas.length} tarea(s)`} size="small" />
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Título</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="center">Peso</TableCell>
                      <TableCell>Publicación</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grupo.tareas.map(tarea => (
                      <TableRow key={tarea.id} hover>
                        <TableCell>{tarea.titulo}</TableCell>
                        <TableCell>
                          <Chip
                            label={tarea.tipo_tarea.charAt(0).toUpperCase() + tarea.tipo_tarea.slice(1)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ fontWeight: 600, color: obtenerColorPeso(pesoTotal) }}>
                            {tarea.peso_porcentual}%
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(tarea.fecha_publicacion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={tarea.estado.charAt(0).toUpperCase() + tarea.estado.slice(1)}
                            size="small"
                            color={obtenerColorEstado(tarea.estado)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            {tarea.estado !== 'cerrada' && (
                              <IconButton
                                size="small"
                                onClick={() => abrirEditar(tarea)}
                                title="Editar"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {tarea.estado === 'borrador' && (
                              <IconButton
                                size="small"
                                onClick={() => publicarTarea(tarea.id, tarea.titulo)}
                                color="success"
                                title="Publicar"
                              >
                                <PublishIcon fontSize="small" />
                              </IconButton>
                            )}
                            {tarea.estado !== 'cerrada' && tarea.esta_vencida && (
                              <IconButton
                                size="small"
                                onClick={() => cerrarTarea(tarea.id, tarea.titulo)}
                                color="error"
                                title="Cerrar"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => eliminarTarea(tarea.id, tarea.titulo)}
                              color="error"
                              title="Eliminar"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Dialog Crear/Editar Tarea */}
      <Dialog open={open} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editing ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Asignatura - Fila completa */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', display: 'block', mb: 0.5 }}>
                Asignatura *
              </Typography>
              <TextField
                select
                name="asignatura"
                value={form.asignatura}
                onChange={handleChange}
                fullWidth
                required
                disabled={!!editing}
              >
                {asignaturas.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.codigo} - {a.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Título - Fila completa */}
            <Grid item xs={12}>
              <TextField
                label="Título"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                fullWidth
                required
                helperText={form.titulo.length < 5 && form.titulo.length > 0 ? 'Mínimo 5 caracteres' : ''}
              />
            </Grid>

            {/* Tipo y Peso - Misma fila */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="tipo-label">Tipo de Evaluación</InputLabel>
                <Select
                  labelId="tipo-label"
                  id="tipo-select"
                  label="Tipo de Evaluación"
                  name="tipo_tarea"
                  value={form.tipo_tarea}
                  onChange={handleChange}
                >
                  <MenuItem value="tarea">Tarea</MenuItem>
                  <MenuItem value="examen">Examen</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="proyecto">Proyecto</MenuItem>
                  <MenuItem value="participacion">Participación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Peso Porcentual (%)"
                name="peso_porcentual"
                type="number"
                value={form.peso_porcentual}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ step: 0.5, min: 0, max: 100 }}
                helperText="Valor entre 0 y 100"
              />
            </Grid>

            {/* Fechas - Misma fila */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Publicación"
                name="fecha_publicacion"
                type="datetime-local"
                value={form.fecha_publicacion}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="Fecha cuando se hará visible"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha Vencimiento"
                name="fecha_vencimiento"
                type="datetime-local"
                value={form.fecha_vencimiento}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="Fecha límite de entrega"
              />
            </Grid>

            {/* Estado - Media fila */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado-select"
                  label="Estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <MenuItem value="borrador">Borrador (no visible)</MenuItem>
                  <MenuItem value="publicada">Publicada (visible para estudiantes)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Descripción - Fila completa */}
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Instrucciones detalladas de la tarea..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarDialog} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardar} size="large">
            {editing ? 'Actualizar Tarea' : 'Crear Tarea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
